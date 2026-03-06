import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Users, ChevronRight, Flame, Sparkles, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CITIES = [
  { name: 'Lisbon', lat: 38.7169, lng: -9.1399 },
  { name: 'Lisboa', lat: 38.7169, lng: -9.1399 },
  { name: 'Porto', lat: 41.1579, lng: -8.6291 },
  { name: 'Braga', lat: 41.5518, lng: -8.4229 },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', lat: 41.3874, lng: 2.1686 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Viseu', lat: 40.6566, lng: -7.9122 },
  { name: 'Coimbra', lat: 40.2033, lng: -8.4103 },
  { name: 'Faro', lat: 37.0194, lng: -7.9322 },
];

function createPlanIcon(plan, isHappening) {
  const coverImg = plan.cover_image || plan.group_image;
  const isHot = plan.is_on_fire || (plan.recent_joins >= 100);
  const isHighlighted = plan.is_highlighted;

  // Use theme_color if available, otherwise fallback
  const borderColor = plan.theme_color
    ? plan.theme_color
    : isHappening
    ? '#f97316'
    : isHighlighted
    ? '#a855f7'
    : isHot
    ? '#ef4444'
    : '#00fea3';

  // Bubble particles for happening plans
  const bubbles = isHappening ? Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * 360;
    const delay = (i * 0.25).toFixed(2);
    const size = 6 + (i % 3) * 3;
    return `
      <div style="
        position:absolute;
        width:${size}px;height:${size}px;border-radius:50%;
        background:${borderColor};opacity:0.85;
        top:50%;left:50%;
        transform-origin:0 0;
        animation:bubble${i} 1.8s ${delay}s infinite ease-in-out;
      "></div>
      <style>
        @keyframes bubble${i} {
          0%   { transform: translate(-50%,-50%) rotate(${angle}deg) translateY(-28px) scale(0.6); opacity:0.9; }
          50%  { transform: translate(-50%,-50%) rotate(${angle + 30}deg) translateY(-36px) scale(1); opacity:0.5; }
          100% { transform: translate(-50%,-50%) rotate(${angle}deg) translateY(-28px) scale(0.6); opacity:0.9; }
        }
      </style>
    `;
  }).join('') : '';

  const pulseStyle = isHappening ? `
    @keyframes happeningPulse {
      0%   { box-shadow: 0 0 0 0 ${borderColor}99; }
      70%  { box-shadow: 0 0 0 12px ${borderColor}00; }
      100% { box-shadow: 0 0 0 0 ${borderColor}00; }
    }
    .happening-pulse { animation: happeningPulse 1.4s infinite; }
  ` : '';

  const badge = isHappening
    ? `<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:${borderColor};color:#0b0b0b;font-size:8px;font-weight:bold;padding:2px 5px;border-radius:8px;white-space:nowrap;z-index:10;">● LIVE</div>`
    : isHot
    ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:14px;z-index:10;">🔥</div>`
    : isHighlighted
    ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:14px;z-index:10;">✨</div>`
    : '';

  const imgContent = coverImg
    ? `<img src="${coverImg}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<div style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#542b9b,${borderColor});display:flex;align-items:center;justify-content:center;font-size:18px;">🎉</div>`;

  const iconH = isHappening ? 80 : 60;

  return L.divIcon({
    className: '',
    html: `
      <style>${pulseStyle}</style>
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;width:80px;height:${iconH}px;margin-left:-16px;">
        ${badge}
        <div style="position:relative;width:48px;height:48px;margin-top:${isHappening ? 16 : 0}px;">
          ${bubbles}
          <div class="${isHappening ? 'happening-pulse' : ''}" style="
            width:48px;height:48px;border-radius:50%;
            border:3px solid ${borderColor};
            overflow:hidden;
            box-shadow:0 0 ${isHappening ? '18px' : '8px'} ${borderColor}88;
            background:#1a1a1a;
            position:relative;z-index:2;
          ">
            ${imgContent}
          </div>
        </div>
      </div>
    `,
    iconSize: [80, iconH],
    iconAnchor: [40, iconH],
    popupAnchor: [0, -(iconH + 4)],
  });
}

function FlyToCity({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 13, { animate: true, duration: 1.2 });
  }, [coords?.lat, coords?.lng]);
  return null;
}

// Draggable bottom card
function ForYouCard({ plans, allParticipants, profilesMap, onPlanClick }) {
  const [minimized, setMinimized] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const hotPlans = plans.filter(p => p.is_on_fire || p.recent_joins >= 100 || p.is_highlighted || (p.matchScore > 20));
  const displayPlans = hotPlans.slice(0, 5);

  if (displayPlans.length === 0) return null;

  const getCount = (planId) => allParticipants.filter(p => p.plan_id === planId).length;

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragStart={(_, info) => setDragStart(info.point.y)}
      onDragEnd={(_, info) => {
        if (info.point.y - (dragStart || 0) > 40) setMinimized(true);
        else if ((dragStart || 0) - info.point.y > 40) setMinimized(false);
      }}
      className="absolute bottom-0 left-0 right-0 z-[500] rounded-t-3xl overflow-hidden"
      style={{ background: 'rgba(11,11,11,0.96)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Drag handle */}
      <div
        className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="w-10 h-1 rounded-full bg-gray-600" />
        <div className="flex items-center gap-2 mt-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-bold text-sm">For You</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${minimized ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="flex gap-3 px-4 pb-4 pt-1 overflow-x-auto scrollbar-hide">
              {displayPlans.map(plan => {
                const isHot = plan.is_on_fire || plan.recent_joins >= 100;
                const isHappening = plan.status === 'happening';
                const count = getCount(plan.id);
                const borderColor = isHappening ? '#f97316' : isHot ? '#ef4444' : plan.is_highlighted ? '#a855f7' : '#00fea3';

                return (
                  <motion.button
                    key={plan.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onPlanClick(plan)}
                    className="flex-shrink-0 w-52 rounded-2xl overflow-hidden text-left relative"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${borderColor}44` }}
                  >
                    {/* Cover image */}
                    <div className="w-full h-28 relative overflow-hidden">
                      {plan.cover_image ? (
                        <img src={plan.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ background: `linear-gradient(135deg, #542b9b, ${borderColor})` }} />
                      )}
                      {/* Overlay badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {isHappening && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500 text-white">● LIVE</span>
                        )}
                        {isHot && !isHappening && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/90 text-white">🔥 Hot</span>
                        )}
                        {plan.is_highlighted && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/90 text-white">✨</span>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-white font-bold text-xs leading-tight truncate">{plan.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-400 text-[10px]">{count} going</span>
                        {plan.matchScore > 0 && (
                          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${borderColor}22`, color: borderColor }}>
                            {plan.matchScore}% match
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HomeMapSection({ plans = [], allParticipants = [], profilesMap = {}, myParticipations = [], city = '', radius = 10, onPlanClick }) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [flyCoords, setFlyCoords] = useState(null);

  // Geocode city to coords
  useEffect(() => {
    if (!city) return;
    const match = CITIES.find(c => c.name.toLowerCase() === city.toLowerCase());
    if (match) {
      setFlyCoords({ lat: match.lat, lng: match.lng });
    } else {
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } })
        .then(r => r.json())
        .then(data => { if (data[0]) setFlyCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }); })
        .catch(() => {});
    }
  }, [city]);

  const validPlans = plans.filter(p => p.latitude && p.longitude);
  const center = flyCoords ? [flyCoords.lat, flyCoords.lng] : validPlans.length > 0 ? [validPlans[0].latitude, validPlans[0].longitude] : [38.7169, -9.1399];

  const recommendedForCard = plans.filter(p => p.status !== 'terminated' && p.status !== 'ended');

  return (
    <div className="mx-4 rounded-3xl overflow-hidden" style={{ height: 320, position: 'relative', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Dark map styles */}
      <style>{`
        .home-map .leaflet-container { background: #1a1a1a !important; }
        .home-map .leaflet-tile { filter: brightness(0.65) saturate(0.7) hue-rotate(185deg) invert(1); }
        .home-map .leaflet-control-attribution { display: none; }
        .home-map .leaflet-control-zoom { display: none; }
      `}</style>

      {/* LIVE header bar */}
      <div className="absolute top-3 left-3 right-3 z-[500] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
          style={{ background: 'rgba(11,11,11,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="w-2 h-2 rounded-full bg-red-500"
          />
          <span className="text-white font-bold text-xs">LIVE</span>
          {city && <span className="text-gray-300 text-xs font-medium">— {city}</span>}
        </div>
        <div className="px-3 py-2 rounded-2xl text-xs font-bold"
          style={{ background: 'rgba(11,11,11,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: '#00fea3' }}>
          {validPlans.length} planos
        </div>
      </div>

      <div className="home-map w-full h-full">
        <MapContainer
          center={center}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {flyCoords && <FlyToCity coords={flyCoords} />}

          {validPlans.map(plan => {
            const isHappening = plan.status === 'happening';
            return (
              <Marker
                key={plan.id}
                position={[plan.latitude, plan.longitude]}
                icon={createPlanIcon(plan, isHappening)}
                eventHandlers={{ click: () => setSelectedPlan(plan) }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Selected plan quick info */}
      <AnimatePresence>
        {selectedPlan && (() => {
          const accentColor = selectedPlan.theme_color
            || (selectedPlan.status === 'happening' ? '#f97316'
            : selectedPlan.is_highlighted ? '#a855f7'
            : selectedPlan.is_on_fire ? '#ef4444'
            : '#00fea3');
          return (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute bottom-4 left-3 right-3 z-[600] rounded-2xl overflow-hidden"
              style={{ background: 'rgba(18,18,18,0.97)', border: `1px solid ${accentColor}44`, backdropFilter: 'blur(16px)' }}
            >
              <div className="flex items-stretch gap-0">
                {/* Photo */}
                <div className="w-20 h-20 flex-shrink-0 relative overflow-hidden">
                  {selectedPlan.cover_image ? (
                    <img src={selectedPlan.cover_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl"
                      style={{ background: `linear-gradient(135deg,#1a1a2e,${accentColor}66)` }}>🎉</div>
                  )}
                  {selectedPlan.status === 'happening' && (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                      style={{ background: accentColor, color: '#0b0b0b' }}>● LIVE</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between">
                  <div>
                    <p className="text-white font-bold text-sm leading-tight truncate">{selectedPlan.title}</p>
                    <p className="text-gray-400 text-[10px] truncate mt-0.5">{selectedPlan.location_address}</p>
                  </div>
                  {/* Party types */}
                  {selectedPlan.tags && selectedPlan.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {selectedPlan.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
                          style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44` }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-center justify-center gap-1.5 pr-2.5 pl-1">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { onPlanClick(selectedPlan); setSelectedPlan(null); }}
                    className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: accentColor, color: '#0b0b0b' }}
                  >
                    Ver
                  </motion.button>
                  <button onClick={() => setSelectedPlan(null)} className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-xs">✕</button>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* For You draggable card — only shown when no plan is selected */}
      {!selectedPlan && (
        <ForYouCard
          plans={recommendedForCard}
          allParticipants={allParticipants}
          profilesMap={profilesMap}
          onPlanClick={(plan) => { onPlanClick(plan); }}
        />
      )}
    </div>
  );
}
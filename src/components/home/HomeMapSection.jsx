import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, ChevronDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '../common/LanguageContext';

// Fix default Leaflet icon
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

const MAP_HEIGHT = 320;

// Inject global CSS once
if (typeof document !== 'undefined' && !document.getElementById('vybt-map-styles')) {
  const style = document.createElement('style');
  style.id = 'vybt-map-styles';
  style.textContent = `
    /* Kill ALL Leaflet default icon styles */
    .leaflet-div-icon,
    .vybt-pin {
      background: none !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    /* Map is static — allow page scroll over it */
    .vybt-leaflet-map,
    .vybt-leaflet-map .leaflet-container,
    .vybt-leaflet-map .leaflet-map-pane {
      touch-action: pan-y !important;
      pointer-events: none !important;
    }
    /* Dark map tiles */
    .vybt-leaflet-map .leaflet-tile {
      filter: brightness(0.6) saturate(0.6) hue-rotate(185deg) invert(1) !important;
    }
    .vybt-leaflet-map .leaflet-container {
      background: var(--bg) !important;
    }
    .vybt-leaflet-map .leaflet-control-attribution,
    .vybt-leaflet-map .leaflet-control-zoom {
      display: none !important;
    }
    /* Pulse animation */
    @keyframes vybt-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(249,115,22,0.7); }
      70%  { box-shadow: 0 0 0 12px rgba(249,115,22,0); }
      100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
    }
    .vybt-pulse { animation: vybt-pulse 1.4s infinite; }
  `;
  document.head.appendChild(style);
}

function createPlanIcon(plan, isHappening) {
  const coverImg = plan.cover_image || plan.group_image || '';
  const isHot = plan.is_on_fire || (plan.recent_joins >= 100);
  const isHighlighted = plan.is_highlighted;
  const color = plan.theme_color
    || (isHappening ? '#f97316' : isHighlighted ? '#a855f7' : isHot ? '#ef4444' : '#00fea3');

  const badge = isHappening
    ? `<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:${color};color:#000;font-size:8px;font-weight:900;padding:2px 6px;border-radius:6px;white-space:nowrap;">● LIVE</div>`
    : isHot
    ? `<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:13px;">🔥</div>`
    : isHighlighted
    ? `<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:13px;">✨</div>`
    : '';

  const inner = coverImg
    ? `<img src="${coverImg}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;display:block;" />`
    : `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#542b9b,${color});display:flex;align-items:center;justify-content:center;font-size:18px;">🎉</div>`;

  return L.divIcon({
    className: 'vybt-pin',
    html: `
      <div style="position:relative;width:56px;height:72px;display:flex;flex-direction:column;align-items:center;">
        ${badge}
        <div class="${isHappening ? 'vybt-pulse' : ''}" style="
          width:44px;height:44px;border-radius:50%;
          border:2.5px solid ${color};
          overflow:hidden;
          box-shadow:0 0 ${isHappening ? '16px' : '6px'} ${color}88;
          margin-top:${isHappening ? 16 : 4}px;
          flex-shrink:0;
        ">${inner}</div>
        <div style="width:2px;height:10px;background:${color};margin-top:2px;border-radius:1px;opacity:0.7;"></div>
        <div style="width:6px;height:6px;background:${color};border-radius:50%;margin-top:1px;opacity:0.5;"></div>
      </div>
    `,
    iconSize: [56, 72],
    iconAnchor: [28, 72],
    popupAnchor: [0, -76],
  });
}

function FlyToCity({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (!coords) return;
    const tryFly = () => {
      const size = map.getSize();
      if (size.x > 0 && size.y > 0) {
        map.flyTo([coords.lat, coords.lng], 13, { animate: true, duration: 1.1 });
      } else {
        setTimeout(tryFly, 100);
      }
    };
    tryFly();
  }, [coords?.lat, coords?.lng]);
  return null;
}

function ForYouCard({ plans, allParticipants, onPlanClick }) {
  const [minimized, setMinimized] = useState(false);
  const {t} = useLanguage();

  const hot = plans.filter(p =>
    p.is_on_fire || p.recent_joins >= 100 || p.is_highlighted || p.status === 'happening'
  ).slice(0, 5);

  if (hot.length === 0) return null;

  const count = (pid) => allParticipants.filter(p => p.plan_id === pid).length;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[500] rounded-t-2xl"
      style={{ background: 'rgba(11,11,11,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex flex-col items-center pt-2 pb-1 cursor-pointer" onClick={() => setMinimized(m => !m)}>
        <div className="w-8 h-1 rounded-full bg-gray-600" />
        <div className="flex items-center gap-1.5 mt-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-white font-bold text-xs">{t.forYou}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${minimized ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-3 px-4 pb-3 pt-1 overflow-x-auto" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              {hot.map(plan => {
                const isHappening = plan.status === 'happening';
                const isHot = plan.is_on_fire || plan.recent_joins >= 100;
                const color = isHappening ? '#f97316' : isHot ? '#ef4444' : plan.is_highlighted ? '#a855f7' : '#00fea3';
                return (
                  <button
                    key={plan.id}
                    onClick={() => onPlanClick(plan)}
                    className="flex-shrink-0 w-48 rounded-xl overflow-hidden text-left"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}33` }}
                  >
                    <div className="w-full h-24 relative overflow-hidden">
                      {plan.cover_image
                        ? <img src={plan.cover_image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full" style={{ background: `linear-gradient(135deg,#542b9b,${color})` }} />
                      }
                      {isHappening && <span className="absolute top-1.5 left-1.5 text-[8px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full">● LIVE</span>}
                    </div>
                    <div className="p-2">
                      <p className="text-white font-bold text-[11px] truncate">{plan.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Users className="w-2.5 h-2.5 text-gray-500" />
                        <span className="text-gray-400 text-[9px]">{count(plan.id)} going</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomeMapSection({ plans = [], allParticipants = [], profilesMap = {}, city = '', onPlanClick }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [flyCoords, setFlyCoords] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!city) return;
    const match = CITIES.find(c => c.name.toLowerCase() === city.toLowerCase());
    if (match) {
      setFlyCoords({ lat: match.lat, lng: match.lng });
      return;
    }
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'en' }
    })
      .then(r => r.json())
      .then(data => {
        if (data[0]) setFlyCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      })
      .catch(() => {});
  }, [city]);

  const validPlans = plans.filter(p => p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude));
  const defaultCenter = flyCoords
    ? [flyCoords.lat, flyCoords.lng]
    : validPlans.length > 0
    ? [validPlans[0].latitude, validPlans[0].longitude]
    : [38.7169, -9.1399];

  const accentOf = (plan) => plan.theme_color
    || (plan.status === 'happening' ? '#f97316' : plan.is_highlighted ? '#a855f7' : plan.is_on_fire ? '#ef4444' : '#00fea3');

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        height: '100%',
        width: '100%',
        position: 'relative',
        border: '1px solid rgba(255,255,255,0.08)',
        isolation: 'isolate',
        contain: 'layout',
      }}
    >
      {/* Critical CSS reset for Leaflet icons */}
      <style>{`
        .leaflet-div-icon { background: none !important; border: none !important; box-shadow: none !important; }
        .vybt-pin { background: none !important; border: none !important; box-shadow: none !important; }
        .vybt-leaflet-map .leaflet-container { background: var(--bg) !important; }
        .vybt-leaflet-map .leaflet-tile { filter: brightness(0.6) saturate(0.6) hue-rotate(185deg) invert(1) !important; }
        .vybt-leaflet-map .leaflet-control-attribution,
        .vybt-leaflet-map .leaflet-control-zoom { display: none !important; }
        .vybt-leaflet-map, .vybt-leaflet-map .leaflet-container { touch-action: pan-y !important; pointer-events: none !important; }
        /* Fix: prevent globals max-width:100% from breaking divIcon elements */
        .vybt-pin *, .vybt-pin *::before, .vybt-pin *::after { max-width: none !important; box-sizing: content-box !important; }
      `}</style>

      {/* Overlaid header */}
      <div className="absolute top-3 left-3 right-3 z-[500] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl pointer-events-auto"
          style={{ background: 'rgba(11,11,11,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-white font-bold text-xs">LIVE</span>
          {city && <span className="text-gray-300 text-xs">— {city}</span>}
        </div>
        <div className="flex items-center px-3 py-1.5 rounded-2xl text-xs font-bold pointer-events-auto"
          style={{ background: 'rgba(11,11,11,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#00fea3', lineHeight: 1 }}>
          {validPlans.length} planos
        </div>
      </div>

      {/* Map — fixed pixel height, static (no drag/scroll) */}
      <div
        className="vybt-leaflet-map"
        style={{ width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={false}
          tap={false}
          touchZoom={false}
          doubleClickZoom={false}
          keyboard={false}
          whenReady={() => setMapReady(true)}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {flyCoords && mapReady && <FlyToCity coords={flyCoords} />}
          {validPlans.map(plan => (
            <Marker
              key={plan.id}
              position={[plan.latitude, plan.longitude]}
              icon={createPlanIcon(plan, plan.status === 'happening')}
              eventHandlers={{ click: () => setSelectedPlan(plan) }}
              interactive={false}
            />
          ))}
        </MapContainer>
      </div>

      {/* Selected plan popup */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            key={selectedPlan.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-4 left-3 right-3 z-[600] rounded-2xl overflow-hidden"
            style={{ background: 'rgba(18,18,18,0.97)', border: `1px solid ${accentOf(selectedPlan)}44`, backdropFilter: 'blur(16px)' }}
          >
            <div className="flex items-stretch">
              <div className="w-20 h-20 flex-shrink-0 overflow-hidden">
                {selectedPlan.cover_image
                  ? <img src={selectedPlan.cover_image} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl"
                      style={{ background: `linear-gradient(135deg,#1a1a2e,${accentOf(selectedPlan)}66)` }}>🎉</div>
                }
              </div>
              <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-center">
                <p className="text-white font-bold text-sm truncate">{selectedPlan.title}</p>
                <p className="text-gray-400 text-[10px] truncate">{selectedPlan.location_address}</p>
                {selectedPlan.tags?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {selectedPlan.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold"
                        style={{ background: `${accentOf(selectedPlan)}22`, color: accentOf(selectedPlan) }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 px-2.5">
                <button
                  onClick={() => { onPlanClick(selectedPlan); setSelectedPlan(null); }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: accentOf(selectedPlan), color: '#0b0b0b' }}
                >Ver</button>
                <button onClick={() => setSelectedPlan(null)}
                  className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-xs">✕</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* For You card */}
      {!selectedPlan && (
        <ForYouCard
          plans={plans.filter(p => p.status !== 'terminated' && p.status !== 'ended')}
          allParticipants={allParticipants}
          onPlanClick={onPlanClick}
        />
      )}
    </div>
  );
}
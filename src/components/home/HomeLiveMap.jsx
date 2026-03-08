import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Users } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CITIES = [
  { name: 'Lisbon', lat: 38.7169, lng: -9.1399 }, { name: 'Lisboa', lat: 38.7169, lng: -9.1399 },
  { name: 'Porto', lat: 41.1579, lng: -8.6291 }, { name: 'Braga', lat: 41.5518, lng: -8.4229 },
  { name: 'Viseu', lat: 40.6566, lng: -7.9122 }, { name: 'Coimbra', lat: 40.2033, lng: -8.4103 },
  { name: 'Faro', lat: 37.0194, lng: -7.9322 }, { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', lat: 41.3874, lng: 2.1686 }, { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'London', lat: 51.5074, lng: -0.1278 }, { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 }, { name: 'Miami', lat: 25.7617, lng: -80.1918 },
];

// Inject map styles once
if (typeof document !== 'undefined' && !document.getElementById('home-live-map-styles')) {
  const s = document.createElement('style');
  s.id = 'home-live-map-styles';
  s.textContent = `
    .hlm-wrap .leaflet-tile { filter: brightness(0.55) saturate(0.5) hue-rotate(190deg) invert(1) !important; }
    .hlm-wrap .leaflet-container { background: #111 !important; touch-action: pan-x pan-y !important; }
    .hlm-wrap .leaflet-control-attribution, .hlm-wrap .leaflet-control-zoom { display: none !important; }
    .hlm-pin { background: none !important; border: none !important; box-shadow: none !important; }
    @keyframes hlm-glow { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.15)} }
    @keyframes hlm-pulse { 0%{box-shadow:0 0 0 0 rgba(255,255,255,0.5)} 70%{box-shadow:0 0 0 14px rgba(255,255,255,0)} 100%{box-shadow:0 0 0 0 rgba(255,255,255,0)} }
    .hlm-pulse { animation: hlm-pulse 1.6s infinite; }
  `;
  document.head.appendChild(s);
}

function createPlanIcon(plan, count) {
  const isHappening = plan.status === 'happening';
  const isHot = plan.is_on_fire || plan.recent_joins >= 100;
  const color = plan.theme_color || (isHappening ? '#f97316' : isHot ? '#ef4444' : plan.is_highlighted ? '#a855f7' : '#00fea3');
  const glowColor = color + 'aa';
  const pulse = isHappening ? 'hlm-pulse' : '';

  const inner = plan.cover_image
    ? `<img src="${plan.cover_image}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<div style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#1a1a2e,${color});display:flex;align-items:center;justify-content:center;font-size:16px;">🎉</div>`;

  const badge = isHappening
    ? `<div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);background:${color};color:#000;font-size:8px;font-weight:900;padding:2px 7px;border-radius:8px;white-space:nowrap;box-shadow:0 0 8px ${color};">● LIVE</div>`
    : '';

  return L.divIcon({
    className: 'hlm-pin',
    html: `
      <div style="position:relative;width:52px;height:68px;display:flex;flex-direction:column;align-items:center;">
        ${badge}
        <div class="${pulse}" style="
          width:44px;height:44px;border-radius:50%;
          border:2.5px solid ${color};
          overflow:hidden;
          box-shadow:0 0 14px ${glowColor},0 0 4px ${color};
          margin-top:${isHappening ? 18 : 4}px;
          flex-shrink:0;
          position:relative;
          background:#111;
        ">${inner}</div>
        <div style="
          position:absolute;
          bottom:10px;
          left:50%;transform:translateX(-50%);
          background:rgba(0,0,0,0.8);
          color:${color};
          font-size:8px;font-weight:700;
          padding:1px 5px;border-radius:6px;
          white-space:nowrap;
          border:1px solid ${color}55;
        ">👥${count}</div>
        <div style="width:2px;height:8px;background:${color};margin-top:1px;border-radius:1px;opacity:0.7;box-shadow:0 0 4px ${color};"></div>
        <div style="width:5px;height:5px;background:${color};border-radius:50%;box-shadow:0 0 6px ${color};opacity:0.8;"></div>
      </div>
    `,
    iconSize: [52, 68],
    iconAnchor: [26, 68],
    popupAnchor: [0, -72],
  });
}

function FlyToCity({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (!coords) return;
    const tryFly = () => {
      const size = map.getSize();
      if (size.x > 0 && size.y > 0) map.flyTo([coords.lat, coords.lng], 13, { animate: true, duration: 1 });
      else setTimeout(tryFly, 100);
    };
    tryFly();
  }, [coords?.lat, coords?.lng]);
  return null;
}

export default function HomeLiveMap({ plans = [], allParticipants = [], city = '', onPlanClick, onExpand }) {
  const [flyCoords, setFlyCoords] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!city) return;
    const match = CITIES.find(c => c.name.toLowerCase() === city.toLowerCase());
    if (match) { setFlyCoords({ lat: match.lat, lng: match.lng }); return; }
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } })
      .then(r => r.json())
      .then(data => { if (data[0]) setFlyCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }); })
      .catch(() => {});
  }, [city]);

  const validPlans = plans.filter(p => p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude));
  const defaultCenter = flyCoords
    ? [flyCoords.lat, flyCoords.lng]
    : validPlans.length > 0 ? [validPlans[0].latitude, validPlans[0].longitude] : [38.7169, -9.1399];

  const countFor = (pid) => allParticipants.filter(p => p.plan_id === pid).length;
  const accentOf = (plan) => plan.theme_color || (plan.status === 'happening' ? '#f97316' : plan.is_highlighted ? '#a855f7' : plan.is_on_fire ? '#ef4444' : '#00fea3');

  return (
    <div className="mx-4 rounded-3xl overflow-hidden" style={{ position: 'relative', border: '1px solid rgba(255,255,255,0.1)', background: '#111' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <motion.div animate={{ opacity: [1,0.3,1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-white font-bold text-sm">🌙 LIVE MAP{city ? ` — ${city}` : ''}</span>
          </div>
          <p style={{ color: '#00fea3' }} className="text-xs font-semibold mt-0.5">{validPlans.length} plans nearby</p>
        </div>
        <button onClick={onExpand} className="flex items-center gap-1 text-gray-400 text-xs">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Map */}
      <div className="hlm-wrap" style={{ height: 220, position: 'relative' }}>
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={true}
          tap={true}
          touchZoom={true}
          doubleClickZoom={true}
          keyboard={false}
          whenReady={() => setMapReady(true)}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {flyCoords && mapReady && <FlyToCity coords={flyCoords} />}
          {validPlans.map(plan => (
            <Marker
              key={plan.id}
              position={[plan.latitude, plan.longitude]}
              icon={createPlanIcon(plan, countFor(plan.id))}
              interactive={true}
              eventHandlers={{ click: () => setSelected(plan) }}
            />
          ))}
        </MapContainer>

        {/* Expand button overlay */}
        <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 500, pointerEvents: 'auto' }}>
          <button
            onClick={onExpand}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold"
            style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
          >
            Expand Map <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selected plan pill */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
            className="absolute bottom-14 left-3 right-3 z-[600] rounded-2xl p-3 flex items-center gap-3"
            style={{ background: 'rgba(18,18,18,0.97)', border: `1px solid ${accentOf(selected)}44`, backdropFilter: 'blur(16px)' }}
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              {selected.cover_image ? <img src={selected.cover_image} className="w-full h-full object-cover" /> :
                <div className="w-full h-full flex items-center justify-center text-xl" style={{ background: `linear-gradient(135deg,#1a1a2e,${accentOf(selected)}66)` }}>🎉</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{selected.title}</p>
              <p className="text-gray-400 text-xs truncate">{selected.location_address}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => { onPlanClick(selected); setSelected(null); }}
                className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: accentOf(selected), color: '#0b0b0b' }}>Ver</button>
              <button onClick={() => setSelected(null)} className="text-gray-500 text-[10px] text-center">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
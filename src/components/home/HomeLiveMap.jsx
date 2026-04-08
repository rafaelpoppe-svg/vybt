import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '../common/LanguageContext';

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('hlm-styles')) {
  const s = document.createElement('style');
  s.id = 'hlm-styles';
  s.textContent = `
    .hlm-wrap .leaflet-tile { filter: brightness(0.55) saturate(0.5) hue-rotate(190deg) invert(1) !important; }
    .hlm-wrap .leaflet-container { background: var(--bg-secondary) !important; }
    .hlm-wrap .leaflet-control-attribution,
    .hlm-wrap .leaflet-control-zoom { display: none !important; }
    .hlm-wrap .leaflet-div-icon { background: none !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
    .hlm-icon-root, .hlm-icon-root * { max-width: none !important; box-sizing: content-box !important; }
    @keyframes hlm-pulse { 0%{box-shadow:0 0 0 0 rgba(249,115,22,0.7)} 70%{box-shadow:0 0 0 12px rgba(249,115,22,0)} 100%{box-shadow:0 0 0 0 rgba(249,115,22,0)} }
    .hlm-pulse { animation: hlm-pulse 1.4s infinite; }
    @keyframes hlm-ripple { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(2.8);opacity:0} }
    .hlm-ripple { position:absolute;border-radius:50%;border:2px solid currentColor;animation:hlm-ripple 2s ease-out infinite;pointer-events:none; }
    .hlm-ripple-2 { animation-delay:0.65s; }
    .hlm-ripple-3 { animation-delay:1.3s; }
    @keyframes hlm-fire-ring { 0%{transform:scale(1);opacity:0.8} 60%{opacity:0.4} 100%{transform:scale(2.2);opacity:0} }
    @keyframes hlm-fire-glow { 0%,100%{box-shadow:0 0 8px 3px rgba(251,146,60,0.9),0 0 20px 6px rgba(239,68,68,0.5)} 50%{box-shadow:0 0 16px 6px rgba(251,191,36,0.9),0 0 32px 10px rgba(249,115,22,0.6)} }
    @keyframes hlm-flame-1 { 0%,100%{transform:translateY(0) scaleX(1);opacity:1} 33%{transform:translateY(-5px) scaleX(0.8);opacity:0.9} 66%{transform:translateY(-3px) scaleX(1.2);opacity:0.7} }
    @keyframes hlm-flame-2 { 0%,100%{transform:translateY(0) scaleX(1);opacity:0.9} 40%{transform:translateY(-6px) scaleX(0.7);opacity:1} 75%{transform:translateY(-2px) scaleX(1.1);opacity:0.6} }
    @keyframes hlm-flame-3 { 0%,100%{transform:translateY(0) scaleX(1);opacity:0.8} 50%{transform:translateY(-7px) scaleX(0.6);opacity:1} }
    .hlm-fire-pulse { animation: hlm-fire-glow 1s ease-in-out infinite; }
    .hlm-fire-ring { position:absolute;border-radius:50%;border:2px solid;animation:hlm-fire-ring 1.2s ease-out infinite;pointer-events:none; }
    .hlm-fire-ring-2 { animation-delay:0.4s; }
    .hlm-fire-ring-3 { animation-delay:0.8s; }
    .hlm-flame { position:absolute;pointer-events:none;font-size:11px;line-height:1; }
    .hlm-flame-a { animation: hlm-flame-1 0.7s ease-in-out infinite; }
    .hlm-flame-b { animation: hlm-flame-2 0.9s ease-in-out infinite; }
    .hlm-flame-c { animation: hlm-flame-3 0.6s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

const CITIES = [
  { name: 'Lisbon', lat: 38.7169, lng: -9.1399 }, { name: 'Lisboa', lat: 38.7169, lng: -9.1399 },
  { name: 'Porto', lat: 41.1579, lng: -8.6291 }, { name: 'Braga', lat: 41.5518, lng: -8.4229 },
  { name: 'Viseu', lat: 40.6566, lng: -7.9122 }, { name: 'Coimbra', lat: 40.2033, lng: -8.4103 },
  { name: 'Faro', lat: 37.0194, lng: -7.9322 }, { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', lat: 41.3874, lng: 2.1686 }, { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'London', lat: 51.5074, lng: -0.1278 }, { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 }, { name: 'Miami', lat: 25.7617, lng: -80.1918 },
];

const TAG_EMOJI = {
  'Techno': '🎛️', 'House': '🎵', 'Hip-Hop': '🎤', 'R&B': '🎶',
  'Pop': '🎉', 'Reggaeton': '🌴', 'Electronic': '⚡', 'Rock': '🎸',
  'Jazz': '🎷', 'Latin': '💃', 'Afro': '🥁', 'Rave': '🔊',
  'Club': '🍾', 'Beach': '🏖️', 'Rooftop': '🌆', 'Festival': '🎪',
  'Lounge': '🛋️', 'Karaoke': '🎤', 'Live Music': '🎸',
};

function isPlanActuallyLive(plan) {
  if (['ended', 'terminated', 'voting'].includes(plan.status)) return false;
  if (!plan.date || !plan.time) return false;
  const now = new Date();
  const start = new Date(`${plan.date}T${plan.time}:00`);
  const end = plan.end_time
    ? new Date(`${plan.date}T${plan.end_time}:00`)
    : new Date(start.getTime() + 8 * 60 * 60 * 1000);
  return now >= start && now <= end;
}

function createPlanIcon(plan) {
  const isHappening = isPlanActuallyLive(plan);
  const isHot = plan.is_on_fire || plan.recent_joins >= 100;
  const isHighlighted = plan.is_highlighted && !isHappening;
  const color = plan.theme_color || (isHappening ? '#f97316' : isHot ? '#ef4444' : isHighlighted ? '#a855f7' : '#00fea3');

  if (isHighlighted) {
    const inner = plan.cover_image || plan.group_image
      ? `<img src="${plan.cover_image || plan.group_image}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;display:block;flex-shrink:0;" />`
      : `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">✨</div>`;
    return L.divIcon({
      className: '',
      html: `
        <div class="hlm-icon-root" style="position:relative;width:60px;height:76px;display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;">
          <div style="position:absolute;top:-2px;left:50%;transform:translateX(-50%);font-size:14px;pointer-events:none;filter:drop-shadow(0 0 4px #a855f7);">👑</div>
          <div style="position:relative;margin-top:14px;flex-shrink:0;">
            <div style="position:absolute;top:-6px;left:-6px;width:56px;height:56px;border-radius:50%;border:2px solid #a855f733;animation:hlm-ripple 2s ease-out infinite;pointer-events:none;"></div>
            <div style="position:absolute;top:-4px;left:-4px;width:52px;height:52px;border-radius:50%;border:2px solid #a855f755;animation:hlm-ripple 2s ease-out 0.65s infinite;pointer-events:none;"></div>
            <div style="width:44px;height:44px;border-radius:50%;border:2.5px solid #a855f7;overflow:hidden;box-shadow:0 0 16px #a855f7aa,0 0 32px #a855f755;">
              ${inner}
            </div>
            <div style="position:absolute;bottom:-2px;right:-6px;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);border:2px solid #0b0b0b;display:flex;align-items:center;justify-content:center;font-size:9px;pointer-events:none;">✨</div>
          </div>
          <div style="width:2px;height:10px;background:linear-gradient(to bottom,#a855f7,transparent);margin-top:2px;border-radius:1px;flex-shrink:0;"></div>
          <div style="width:6px;height:6px;background:#a855f7;border-radius:50%;box-shadow:0 0 6px #a855f7;flex-shrink:0;"></div>
        </div>
      `,
      iconSize: [60, 76],
      iconAnchor: [30, 76],
      popupAnchor: [0, -80],
    });
  }

  const firstTag = plan.tags?.[0];
  const tagEmoji = firstTag ? (TAG_EMOJI[firstTag] || '🎉') : null;
  const tagBadge = tagEmoji
    ? '<div style="position:absolute;bottom:6px;right:-4px;width:18px;height:18px;border-radius:50%;background:#0b0b0b;border:1.5px solid ' + color + ';display:flex;align-items:center;justify-content:center;font-size:9px;pointer-events:none;flex-shrink:0;">' + tagEmoji + '</div>'
    : '';

  const inner = (plan.cover_image || plan.group_image)
    ? '<img src="' + (plan.cover_image || plan.group_image) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;display:block;flex-shrink:0;" />'
    : '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#542b9b,' + color + ');display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">🎉</div>';

  let ripples = '';
  let flames = '';
  let pulseClass = '';
  let glowSize = '5px';
  let iconH = 62;
  let marginTop = 4;

  if (isHot) {
    ripples = '<div class="hlm-fire-ring" style="width:36px;height:36px;top:0;left:0;border-color:#f97316;"></div>'
            + '<div class="hlm-fire-ring hlm-fire-ring-2" style="width:36px;height:36px;top:0;left:0;border-color:#ef4444;"></div>'
            + '<div class="hlm-fire-ring hlm-fire-ring-3" style="width:36px;height:36px;top:0;left:0;border-color:#fbbf24;"></div>';
    flames = '<div class="hlm-flame hlm-flame-a" style="position:absolute;top:-14px;left:4px;font-size:11px;pointer-events:none;">🔥</div>'
           + '<div class="hlm-flame hlm-flame-b" style="position:absolute;top:-12px;right:4px;font-size:11px;pointer-events:none;">🔥</div>'
           + '<div class="hlm-flame hlm-flame-c" style="position:absolute;top:-10px;left:11px;font-size:11px;pointer-events:none;">🔥</div>';
    pulseClass = 'hlm-fire-pulse';
    glowSize = '12px';
    iconH = 74;
    marginTop = 16;
  } else if (isHappening) {
    ripples = '<div class="hlm-ripple" style="width:36px;height:36px;top:0;left:0;color:' + color + ';"></div>'
            + '<div class="hlm-ripple hlm-ripple-2" style="width:36px;height:36px;top:0;left:0;color:' + color + ';"></div>'
            + '<div class="hlm-ripple hlm-ripple-3" style="width:36px;height:36px;top:0;left:0;color:' + color + ';"></div>';
    pulseClass = 'hlm-pulse';
    glowSize = '12px';
  }

  const html = '<div class="hlm-icon-root" style="position:relative;width:48px;height:' + iconH + 'px;display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;">'
    + '<div style="position:relative;margin-top:' + marginTop + 'px;flex-shrink:0;">'
    + flames + ripples
    + '<div class="' + pulseClass + '" style="width:36px;height:36px;border-radius:50%;border:2px solid ' + color + ';overflow:hidden;box-shadow:0 0 ' + glowSize + ' ' + color + '88;">'
    + inner + '</div>' + tagBadge + '</div>'
    + '<div style="width:2px;height:8px;background:' + color + ';margin-top:2px;border-radius:1px;opacity:0.8;flex-shrink:0;"></div>'
    + '<div style="width:5px;height:5px;background:' + color + ';border-radius:50%;opacity:0.6;flex-shrink:0;"></div>'
    + '</div>';

  return L.divIcon({ className: '', html, iconSize: [48, iconH], iconAnchor: [24, iconH], popupAnchor: [0, -(iconH + 4)] });
}

function MapTapToDismiss({ onDismiss }) {
  useMapEvents({ click: () => onDismiss() });
  return null;
}

function FlyToCity({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (!coords) return;
    const tryFly = () => {
      const size = map.getSize();
      if (size.x > 0 && size.y > 0) map.setView([coords.lat, coords.lng], 13, { animate: false });
      else setTimeout(tryFly, 100);
    };
    tryFly();
  }, [coords?.lat, coords?.lng]);
  return null;
}

const POI_TYPE_ICON = { club: '🪩', bar: '🍺', pub: '🍻', event_venue: '🎪', restaurant: '🍽️' };
const POI_COLOR = '#f59e0b';

function createPoiIcon(poi) {
  const emoji = POI_TYPE_ICON[poi.type] || '📍';
  return L.divIcon({
    className: '',
    html: `
      <div class="hlm-icon-root" style="position:relative;width:40px;height:52px;display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#b45309,${POI_COLOR});border:2px solid ${POI_COLOR};display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 8px ${POI_COLOR}88;margin-top:4px;flex-shrink:0;">
          ${emoji}
        </div>
        <div style="width:2px;height:6px;background:${POI_COLOR};margin-top:2px;border-radius:1px;opacity:0.8;flex-shrink:0;"></div>
        <div style="width:5px;height:5px;background:${POI_COLOR};border-radius:50%;opacity:0.6;flex-shrink:0;"></div>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
  });
}

function groupPlansByLocation(plans) {
  const TOLERANCE = 0.0001;
  const groups = [];
  const used = new Set();
  for (let i = 0; i < plans.length; i++) {
    if (used.has(i)) continue;
    const group = [plans[i]];
    used.add(i);
    for (let j = i + 1; j < plans.length; j++) {
      if (used.has(j)) continue;
      if (Math.abs(plans[i].latitude - plans[j].latitude) < TOLERANCE &&
          Math.abs(plans[i].longitude - plans[j].longitude) < TOLERANCE) {
        group.push(plans[j]);
        used.add(j);
      }
    }
    groups.push(group);
  }
  return groups;
}

function createClusterIcon(count, color) {
  return L.divIcon({
    className: '',
    html: `
      <div class="hlm-icon-root" style="position:relative;width:50px;height:64px;display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;">
        <div style="position:relative;margin-top:4px;flex-shrink:0;">
          <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#542b9b,${color});border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px ${color}99;">
            <span style="color:#fff;font-weight:900;font-size:16px;line-height:1;">${count}</span>
          </div>
          <div style="position:absolute;top:-6px;right:-4px;width:18px;height:18px;border-radius:50%;background:#ff4757;border:2px solid #0b0b0b;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;pointer-events:none;">🎉</div>
        </div>
        <div style="width:2px;height:8px;background:${color};margin-top:2px;border-radius:1px;opacity:0.8;flex-shrink:0;"></div>
        <div style="width:5px;height:5px;background:${color};border-radius:50%;opacity:0.6;flex-shrink:0;"></div>
      </div>
    `,
    iconSize: [50, 64],
    iconAnchor: [25, 64],
    popupAnchor: [0, -68],
  });
}

const DATE_LOCALES = { pt: 'pt-PT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR', it: 'it-IT' };

export default function HomeLiveMap({ plans = [], allParticipants = [], city = '', pois = [], onPlanClick }) {
  const { t, language } = useLanguage();
  const [flyCoords, setFlyCoords] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [mapMode, setMapMode] = useState('plans');

  const dateLocale = DATE_LOCALES[language] || 'en-GB';

  useEffect(() => {
    if (!city) return;
    const match = CITIES.find(c => c.name.toLowerCase() === city.toLowerCase());
    if (match) { setFlyCoords({ lat: match.lat, lng: match.lng }); return; }
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } })
      .then(r => r.json())
      .then(data => { if (data[0]) setFlyCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }); })
      .catch(() => {});
  }, [city]);

  useEffect(() => { setSelected(null); setSelectedPoi(null); }, [city]);

  const showPlans = true;
  const showPois = false;

  const now = new Date();
  const validPlans = plans.filter(p => {
    if (!p.latitude || !p.longitude || isNaN(p.latitude) || isNaN(p.longitude)) return false;
    if (['voting', 'ended', 'terminated'].includes(p.status)) return false;
    if (p.is_private || p.show_in_map === false) return false;
    if (p.date && p.time) {
      const start = new Date(`${p.date}T${p.time}:00`);
      let end;
      if (p.end_time) {
        end = new Date(`${p.date}T${p.end_time}:00`);
        if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      } else {
        end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
      }
      if (now > end) return false;
    }
    return true;
  });

  const defaultCenter = flyCoords
    ? [flyCoords.lat, flyCoords.lng]
    : validPlans.length > 0 ? [validPlans[0].latitude, validPlans[0].longitude] : [38.7169, -9.1399];

  const countFor = (pid) => allParticipants.filter(p => p.plan_id === pid).length;
  const accentOf = (plan) => plan.theme_color || (isPlanActuallyLive(plan) ? '#f97316' : plan.is_highlighted ? '#a855f7' : plan.is_on_fire ? '#ef4444' : '#00fea3');

  const formatDate = (plan) => {
    if (!plan.date) return '';
    return new Date(plan.date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' });
  };

  return (
    <div
      className="hlm-wrap rounded-3xl overflow-hidden"
      style={{ position: 'relative', height: 280, width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg)', zIndex: 450, isolation: 'isolate' }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={true}
        tap={true}
        touchZoom={true}
        doubleClickZoom={false}
        keyboard={false}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {flyCoords && mapReady && <FlyToCity coords={flyCoords} />}
        <MapTapToDismiss onDismiss={() => { setSelected(null); setSelectedCluster(null); }} />
        {showPlans && groupPlansByLocation(validPlans).map((group, idx) => {
          const plan = group[0];
          if (group.length === 1) {
            return (
              <Marker
                key={`${plan.id}_${plan.status}`}
                position={[plan.latitude, plan.longitude]}
                icon={createPlanIcon(plan)}
                eventHandlers={{ click: () => { setSelected(plan); setSelectedCluster(null); setSelectedPoi(null); } }}
              />
            );
          }
          const clusterColor = plan.theme_color || '#00fea3';
          return (
            <Marker
              key={`cluster_${idx}`}
              position={[plan.latitude, plan.longitude]}
              icon={createClusterIcon(group.length, clusterColor)}
              eventHandlers={{ click: () => { setSelectedCluster(group); setSelected(null); setSelectedPoi(null); } }}
            />
          );
        })}
        {showPois && (pois.filter(p => p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude))).map(poi => (
          <Marker
            key={poi.id}
            position={[poi.latitude, poi.longitude]}
            icon={createPoiIcon(poi)}
            eventHandlers={{ click: () => { setSelectedPoi(poi); setSelected(null); } }}
          />
        ))}
      </MapContainer>

      {/* LIVE badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 500,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(11,11,11,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20, padding: '5px 12px', pointerEvents: 'none',
      }}>
        <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
          style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, lineHeight: 1 }}>LIVE{city ? ` — ${city}` : ''}</span>
      </div>

      {/* Cluster popup */}
      <AnimatePresence>
        {selectedCluster && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            style={{
              position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 600,
              borderRadius: 22, overflow: 'hidden',
              background: 'rgba(14,14,14,0.97)',
              border: '1.5px solid rgba(0,254,163,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,254,163,0.15)',
            }}
          >
            <div style={{ height: 3, background: 'linear-gradient(90deg,#542b9b,#00fea3)' }} />
            <div style={{ padding: '10px 12px' }}>
              <p style={{ color: '#aaa', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                📍 {selectedCluster.length} {t.plansAtThisLocation}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedCluster.map(plan => (
                  <motion.button
                    key={plan.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { onPlanClick(plan); setSelectedCluster(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'rgba(255,255,255,0.05)', border: `1px solid ${accentOf(plan)}33`,
                      borderRadius: 14, padding: '8px 10px', cursor: 'pointer', textAlign: 'left'
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${accentOf(plan)}44` }}>
                      {plan.cover_image
                        ? <img src={plan.cover_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: `linear-gradient(135deg,#1a1a2e,${accentOf(plan)}66)` }}>🎉</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontWeight: 800, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.title}</p>
                      <p style={{ color: '#666', fontSize: 10 }}>{plan.time}{plan.date ? ` · ${formatDate(plan)}` : ''}</p>
                    </div>
                    <span style={{ color: accentOf(plan), fontSize: 12, fontWeight: 800 }}>→</span>
                  </motion.button>
                ))}
              </div>
              <button onClick={() => setSelectedCluster(null)} style={{ color: '#555', fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, width: '100%' }}>{t.close}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected plan popup */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            style={{
              position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 600,
              borderRadius: 22, overflow: 'hidden',
              background: 'var(--bg)',
              border: `1.5px solid ${accentOf(selected)}55`,
              backdropFilter: 'blur(20px)',
              boxShadow: `0 8px 32px ${accentOf(selected)}33`,
            }}
          >
            <div style={{ height: 3, background: `linear-gradient(90deg, ${accentOf(selected)}, ${accentOf(selected)}88)` }} />
            <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${accentOf(selected)}44` }}>
                {selected.cover_image
                  ? <img src={selected.cover_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: `linear-gradient(135deg,#1a1a2e,${accentOf(selected)}66)` }}>🎉</div>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  {isPlanActuallyLive(selected) && (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      style={{ background: 'rgba(249,115,22,0.18)', color: '#f97316', padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 800 }}
                    >● LIVE</motion.span>
                  )}
                  {selected.tags?.[0] && (
                    <span style={{ background: `${accentOf(selected)}22`, color: accentOf(selected), padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 600 }}>
                      {selected.tags[0]}
                    </span>
                  )}
                </div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{selected.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 10 }}>👥</span>
                    <span style={{ color: accentOf(selected), fontWeight: 700, fontSize: 11 }}>{countFor(selected.id)}</span>
                  </div>
                  {selected.time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 10 }}>🕐</span>
                      <span style={{ color: '#aaa', fontSize: 10 }}>{selected.time}{selected.date ? ` · ${formatDate(selected)}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => { onPlanClick(selected); setSelected(null); }}
                  style={{ background: `linear-gradient(135deg, ${accentOf(selected)}, ${accentOf(selected)}cc)`, color: '#0b0b0b', fontWeight: 800, fontSize: 12, padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', boxShadow: `0 4px 12px ${accentOf(selected)}55` }}
                >
                  {t.viewArrow}
                </motion.button>
                <button onClick={() => setSelected(null)} style={{ color: '#555', fontSize: 10, background: 'none', border: 'none', cursor: 'pointer' }}>{t.close}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
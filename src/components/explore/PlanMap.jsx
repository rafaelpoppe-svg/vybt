import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Users, Clock, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import PartyTag from '../common/PartyTag';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored marker
function createCustomIcon(color, isHighlighted, isOnFire) {
  const bgColor = isOnFire ? '#f97316' : isHighlighted ? '#542b9b' : color || '#00fea3';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 36px; height: 36px;
        background: ${bgColor};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 14px;">
          ${isOnFire ? '🔥' : isHighlighted ? '✨' : '🎉'}
        </span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

function MapAutoCenter({ plans }) {
  const map = useMap();
  const validPlans = plans.filter(p => p.latitude && p.longitude);
  if (validPlans.length > 0 && map) {
    const bounds = L.latLngBounds(validPlans.map(p => [p.latitude, p.longitude]));
    // Only fit once
  }
  return null;
}

export default function PlanMap({ plans, allParticipants, profilesMap, myParticipations }) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const validPlans = plans.filter(p => p.latitude && p.longitude);
  const center = validPlans.length > 0
    ? [validPlans[0].latitude, validPlans[0].longitude]
    : [38.7169, -9.1399]; // Lisboa default

  const getParticipantCount = (planId) => allParticipants.filter(p => p.plan_id === planId).length;
  const isJoined = (planId) => myParticipations.some(p => p.plan_id === planId);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 284px)' }}>
      {/* Map styles override for dark theme */}
      <style>{`
        .leaflet-container { background: #1a1a1a !important; }
        .leaflet-tile { filter: brightness(0.75) saturate(0.8) hue-rotate(180deg) invert(1); }
        .leaflet-control-attribution { display: none; }
        .leaflet-popup-content-wrapper {
          background: #1a1a1a !important;
          border: 1px solid #333 !important;
          border-radius: 12px !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip { background: #1a1a1a !important; }
        .leaflet-popup-content { margin: 0 !important; }
      `}</style>

      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%', borderRadius: '0' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {validPlans.map((plan) => {
          const isOnFire = plan.is_on_fire || (plan.recent_joins >= 100);
          return (
            <Marker
              key={plan.id}
              position={[plan.latitude, plan.longitude]}
              icon={createCustomIcon(plan.theme_color, plan.is_highlighted, isOnFire)}
              eventHandlers={{ click: () => setSelectedPlan(plan) }}
            />
          );
        })}
      </MapContainer>

      {/* No location plans notice */}
      {validPlans.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-[999]">
          <div className="text-center px-6">
            <MapPin className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No plans with location data available.</p>
          </div>
        </div>
      )}

      {/* Plans count badge */}
      <div className="absolute top-3 left-3 z-[999] px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm border border-gray-700">
        <span className="text-white text-xs font-medium">{validPlans.length} plans on map</span>
      </div>

      {/* Selected plan bottom sheet */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-[999] bg-[#161616] border-t border-gray-800 rounded-t-2xl p-4 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  {selectedPlan.is_highlighted && <span className="text-xs text-[#00fea3]">✨ Highlighted</span>}
                  {(selectedPlan.is_on_fire || selectedPlan.recent_joins >= 100) && <span className="text-xs text-orange-400">🔥 On Fire</span>}
                </div>
                <h3 className="text-white font-bold text-lg leading-tight">{selectedPlan.title}</h3>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1.5 rounded-full bg-gray-800 flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4 text-[#00fea3]" />
                <span>{format(new Date(selectedPlan.date), 'MMM d')} · {selectedPlan.time}{selectedPlan.end_time ? ` - ${selectedPlan.end_time}` : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-[#00fea3]" />
                <span className="truncate">{selectedPlan.location_address}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Users className="w-4 h-4 text-[#00fea3]" />
                <span>{getParticipantCount(selectedPlan.id)} going</span>
                {isJoined(selectedPlan.id) && (
                  <span className="px-2 py-0.5 rounded-full bg-[#00fea3]/20 text-[#00fea3] text-xs font-medium">Joined</span>
                )}
              </div>
            </div>

            {/* Tags */}
            {selectedPlan.tags?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedPlan.tags.map((tag, i) => (
                  <PartyTag key={i} tag={tag} size="sm" selected />
                ))}
              </div>
            )}

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${selectedPlan.id}`)}
              className="w-full py-3.5 rounded-full font-bold text-[#0b0b0b] flex items-center justify-center gap-2"
              style={{ backgroundColor: selectedPlan.theme_color || '#00fea3' }}
            >
              View Plan
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
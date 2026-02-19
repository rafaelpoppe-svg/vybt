import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Users, Clock, ChevronRight, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import PartyTag from '../common/PartyTag';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const CITIES = [
  { name: 'Lisboa', lat: 38.7169, lng: -9.1399 },
  { name: 'Porto', lat: 41.1579, lng: -8.6291 },
  { name: 'Faro', lat: 37.0194, lng: -7.9322 },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Milan', lat: 45.4654, lng: 9.1859 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Ibiza', lat: 38.9067, lng: 1.4206 },
  { name: 'Mykonos', lat: 37.4467, lng: 25.3289 },
];

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

function FlyToCity({ coords }) {
  const map = useMap();
  if (coords) {
    map.flyTo([coords.lat, coords.lng], 13, { animate: true, duration: 1.2 });
  }
  return null;
}

export default function PlanMap({ plans, allParticipants, profilesMap, myParticipations }) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [flyCoords, setFlyCoords] = useState(null);

  const validPlans = plans.filter(p => p.latitude && p.longitude);
  const center = validPlans.length > 0
    ? [validPlans[0].latitude, validPlans[0].longitude]
    : [38.7169, -9.1399]; // Lisboa default

  const filteredCities = CITIES.filter(c =>
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleSelectCity = (city) => {
    setFlyCoords({ lat: city.lat, lng: city.lng });
    setCitySearch(city.name);
    setShowCityDropdown(false);
  };

  const getParticipantCount = (planId) => allParticipants.filter(p => p.plan_id === planId).length;
  const isJoined = (planId) => myParticipations.some(p => p.plan_id === planId);

  return (
    <div className="relative w-full h-full">
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
        {flyCoords && <FlyToCity coords={flyCoords} />}

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

      {/* City Search */}
      <div className="absolute top-3 left-3 right-3 z-[999]">
        <div className="relative">
          <div className="flex items-center bg-black/80 backdrop-blur-md border border-gray-700 rounded-xl px-3 py-2 gap-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={citySearch}
              onChange={(e) => { setCitySearch(e.target.value); setShowCityDropdown(true); }}
              onFocus={() => setShowCityDropdown(true)}
              placeholder="Go to city..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 outline-none"
            />
            <span className="text-gray-600 text-xs">{validPlans.length} plans</span>
          </div>
          {showCityDropdown && filteredCities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-1 left-0 right-0 bg-[#1a1a1a] border border-gray-700 rounded-xl overflow-hidden shadow-xl max-h-52 overflow-y-auto"
            >
              {filteredCities.map(city => (
                <button
                  key={city.name}
                  onMouseDown={() => handleSelectCity(city)}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-gray-800 flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#00fea3]" />
                  {city.name}
                </button>
              ))}
            </motion.div>
          )}
        </div>
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
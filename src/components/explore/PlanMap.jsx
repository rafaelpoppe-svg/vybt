import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Users, Clock, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import PartyTag from '../common/PartyTag';
import LocationSelector from '../common/LocationSelector';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const CITIES = [
  // Europe - Capitals
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Athens', lat: 37.9838, lng: 23.7275 },
  { name: 'Belgrade', lat: 44.8176, lng: 20.4569 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Bern', lat: 46.9481, lng: 7.4474 },
  { name: 'Bratislava', lat: 48.1486, lng: 17.1077 },
  { name: 'Brussels', lat: 50.8503, lng: 4.3517 },
  { name: 'Bucharest', lat: 44.4268, lng: 26.1025 },
  { name: 'Budapest', lat: 47.4979, lng: 19.0402 },
  { name: 'Copenhagen', lat: 55.6761, lng: 12.5683 },
  { name: 'Dublin', lat: 53.3498, lng: -6.2603 },
  { name: 'Helsinki', lat: 60.1699, lng: 24.9384 },
  { name: 'Kiev', lat: 50.4501, lng: 30.5234 },
  { name: 'Lisbon', lat: 38.7169, lng: -9.1399 },
  { name: 'Ljubljana', lat: 46.0569, lng: 14.5058 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Luxembourg', lat: 49.6116, lng: 6.1319 },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Minsk', lat: 53.9045, lng: 27.5615 },
  { name: 'Monaco', lat: 43.7384, lng: 7.4246 },
  { name: 'Nicosia', lat: 35.1856, lng: 33.3823 },
  { name: 'Oslo', lat: 59.9139, lng: 10.7522 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Prague', lat: 50.0755, lng: 14.4378 },
  { name: 'Reykjavik', lat: 64.1355, lng: -21.8954 },
  { name: 'Riga', lat: 56.9496, lng: 24.1052 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964 },
  { name: 'Sarajevo', lat: 43.8563, lng: 18.4131 },
  { name: 'Skopje', lat: 41.9981, lng: 21.4254 },
  { name: 'Sofia', lat: 42.6977, lng: 23.3219 },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  { name: 'Tallinn', lat: 59.4370, lng: 24.7536 },
  { name: 'Tirana', lat: 41.3317, lng: 19.8319 },
  { name: 'Vienna', lat: 48.2082, lng: 16.3738 },
  { name: 'Vilnius', lat: 54.6872, lng: 25.2797 },
  { name: 'Warsaw', lat: 52.2297, lng: 21.0122 },
  { name: 'Zagreb', lat: 45.8150, lng: 15.9819 },
  // USA - Major cities
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix', lat: 33.4484, lng: -112.0740 },
  { name: 'Philadelphia', lat: 39.9526, lng: -75.1652 },
  { name: 'San Antonio', lat: 29.4241, lng: -98.4936 },
  { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
  { name: 'Dallas', lat: 32.7767, lng: -96.7970 },
  { name: 'San Jose', lat: 37.3382, lng: -121.8863 },
  { name: 'Austin', lat: 30.2672, lng: -97.7431 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
  { name: 'Denver', lat: 39.7392, lng: -104.9903 },
  { name: 'Nashville', lat: 36.1627, lng: -86.7816 },
  { name: 'Washington DC', lat: 38.9072, lng: -77.0369 },
  { name: 'Las Vegas', lat: 36.1699, lng: -115.1398 },
  { name: 'Boston', lat: 42.3601, lng: -71.0589 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Atlanta', lat: 33.7490, lng: -84.3880 },
  { name: 'Minneapolis', lat: 44.9778, lng: -93.2650 },
  { name: 'New Orleans', lat: 29.9511, lng: -90.0715 },
  { name: 'Detroit', lat: 42.3314, lng: -83.0458 },
  { name: 'Portland', lat: 45.5051, lng: -122.6750 },
  { name: 'Charlotte', lat: 35.2271, lng: -80.8431 },
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

export default function PlanMap({ plans, allParticipants, profilesMap, myParticipations, selectedCity: initialCity, selectedRadius: initialRadius, onCityChange, onRadiusChange }) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [flyCoords, setFlyCoords] = useState(null);
  const [mapCity, setMapCity] = useState(initialCity || localStorage.getItem('selectedCity') || '');
  const [mapRadius, setMapRadius] = useState(initialRadius || Number(localStorage.getItem('selectedRadius')) || 10);

  // Fly to city whenever mapCity changes (from LocationSelector or parent)
  React.useEffect(() => {
    const cityToFly = initialCity || mapCity;
    if (cityToFly) {
      // First try static list
      const match = CITIES.find(c => c.name.toLowerCase() === cityToFly.toLowerCase());
      if (match) {
        setFlyCoords({ lat: match.lat, lng: match.lng });
      } else {
        // Geocode via Nominatim for cities not in static list (e.g. Braga)
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityToFly)}&format=json&limit=1`, {
          headers: { 'Accept-Language': 'en' }
        })
          .then(r => r.json())
          .then(data => {
            if (data[0]) setFlyCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          })
          .catch(() => {});
      }
    }
  }, [initialCity, mapCity]);

  const handleCityChange = (c) => {
    setMapCity(c);
    localStorage.setItem('selectedCity', c);
    if (onCityChange) onCityChange(c);
  };

  const handleRadiusChange = (r) => {
    setMapRadius(r);
    localStorage.setItem('selectedRadius', r);
    if (onRadiusChange) onRadiusChange(r);
  };

  const validPlans = plans.filter(p => p.latitude && p.longitude);
  const center = flyCoords
    ? [flyCoords.lat, flyCoords.lng]
    : validPlans.length > 0
      ? [validPlans[0].latitude, validPlans[0].longitude]
      : [38.7169, -9.1399]; // Lisboa default

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

      {/* Location Selector - same as Home */}
      <div className="absolute top-3 left-3 z-[999]">
        <LocationSelector
          city={mapCity}
          radius={mapRadius}
          onCityChange={handleCityChange}
          onRadiusChange={handleRadiusChange}
        />
      </div>

      {/* Plans count badge */}
      <div className="absolute top-3 right-3 z-[999] px-3 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-gray-700 text-gray-400 text-xs">
        {validPlans.length} plans
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
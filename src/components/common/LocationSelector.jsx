import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Loader2, Navigation, Lock } from 'lucide-react';

const popularCities = [
  // Europe - Capitals
  'Amsterdam', 'Athens', 'Belgrade', 'Berlin', 'Bern', 'Bratislava', 'Brussels',
  'Bucharest', 'Budapest', 'Copenhagen', 'Dublin', 'Helsinki', 'Kiev',
  'Lisbon', 'Ljubljana', 'London', 'Luxembourg', 'Madrid', 'Minsk',
  'Monaco', 'Nicosia', 'Oslo', 'Paris', 'Podgorica', 'Prague',
  'Reykjavik', 'Riga', 'Rome', 'San Marino', 'Sarajevo', 'Skopje',
  'Sofia', 'Stockholm', 'Tallinn', 'Tirana', 'Valletta', 'Vienna',
  'Vilnius', 'Warsaw', 'Zagreb',
  // USA - Major cities
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
  'Indianapolis', 'San Francisco', 'Seattle', 'Denver', 'Nashville',
  'Oklahoma City', 'El Paso', 'Washington DC', 'Las Vegas', 'Boston',
  'Memphis', 'Louisville', 'Portland', 'Baltimore', 'Milwaukee',
  'Miami', 'Atlanta', 'Minneapolis', 'New Orleans', 'Detroit',
];

export default function LocationSelector({ city, radius, onCityChange, onRadiusChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [detecting, setDetecting] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            null;
          if (detectedCity) {
            onCityChange(detectedCity);
            setIsOpen(false);
          }
        } catch (_) {}
        setDetecting(false);
      },
      () => setDetecting(false),
      { timeout: 8000 }
    );
  };

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 border border-gray-800"
      >
        <MapPin className="w-4 h-4 text-[#00fea3]" />
        <span className="text-white text-sm font-medium">
          {city || 'Select location'}
        </span>
        <span className="text-gray-500 text-xs">
          {radius}km
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl bg-gray-900 border border-gray-800 z-50 min-w-64"
          >
            {/* Detect my location button */}
            <button
              onClick={detectLocation}
              disabled={detecting}
              className="w-full flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-[#00fea3]/10 border border-[#00fea3]/30 text-[#00fea3] text-sm font-medium hover:bg-[#00fea3]/20 transition-all disabled:opacity-50"
            >
              {detecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {detecting ? 'Detecting...' : 'Use my current location'}
            </button>

            {/* City search + list — locked for Vybt Plus */}
            <div className="relative rounded-xl overflow-hidden">
              {/* Blurred / disabled city list */}
              <div className="pointer-events-none select-none opacity-40">
                <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-gray-800 border border-gray-700">
                  <div className="w-4 h-4 rounded bg-gray-600" />
                  <div className="flex-1 h-4 rounded bg-gray-600" />
                </div>
                <div className="space-y-1 max-h-40 overflow-hidden mb-4">
                  {['London', 'Madrid', 'Paris', 'Berlin', 'Rome'].map((c) => (
                    <div key={c} className="w-full px-3 py-2 rounded-lg text-sm text-gray-500 bg-gray-800/50">
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-xl px-4 text-center">
                <Lock className="w-5 h-5 text-[#00fea3] mb-1.5" />
                <p className="text-white text-xs font-semibold">Vybt Plus members only</p>
                <p className="text-gray-500 text-[10px] mt-0.5">Coming soon</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800 mt-3">
              <label className="text-xs text-gray-500 mb-2 block">Radius: {radius}km</label>
              <input
                type="range"
                min="5"
                max="100"
                value={radius}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="w-full accent-[#00fea3]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
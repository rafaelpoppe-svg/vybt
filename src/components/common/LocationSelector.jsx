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

export default function LocationSelector({ city, radius, onCityChange, onRadiusChange, adminMode = false }) {
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
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all border text-xs ${
          isOpen
            ? 'bg-gradient-to-r from-[#00c6d2]/20 to-[#7c3aed]/20 border-[#00c6d2]/50'
            : 'bg-white/5 border-white/10'
        }`}
      >
        <span className="text-xs">📍</span>
        <span className="text-white text-[11px] font-bold max-w-[60px] truncate">
          {city || 'Loc'}
        </span>
        <span className="text-[#00c6d2] text-[9px] font-semibold bg-[#00c6d2]/10 px-1 py-0.5 rounded-full whitespace-nowrap">
          {radius}km
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="absolute top-full right-0 mt-2 p-3 rounded-2xl bg-[#111] border border-white/10 z-50 w-64 max-h-80 overflow-hidden shadow-xl shadow-black/60"
            style={{ background: 'linear-gradient(145deg, #161616 0%, #111 100%)' }}
          >
            {/* Detect my location button */}
            <button
              onClick={detectLocation}
              disabled={detecting}
              className="w-full flex items-center gap-2 px-3 py-2 mb-3 rounded-xl bg-gradient-to-r from-[#00c6d2]/15 to-[#7c3aed]/15 border border-[#00c6d2]/30 text-[#00c6d2] text-sm font-semibold hover:from-[#00c6d2]/25 hover:to-[#7c3aed]/25 transition-all disabled:opacity-50"
            >
              {detecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-base">🧭</span>
              )}
              {detecting ? 'Detecting...' : 'Use my current location'}
            </button>

            {/* City list */}
            {adminMode && (
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city..."
                className="w-full px-3 py-2 mb-2 rounded-lg bg-gray-800 text-sm text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-[#00fea3]"
              />
            )}
            <div className="space-y-1 max-h-48 overflow-y-auto mb-1">
              {adminMode ? (
                popularCities
                  .filter(c => c.toLowerCase().includes(search.toLowerCase()))
                  .map((c) => (
                    <button
                      key={c}
                      onClick={() => { onCityChange(c); setIsOpen(false); setSearch(''); }}
                      className={`w-full flex items-center px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                        city === c ? 'bg-gradient-to-r from-[#00c6d2]/20 to-[#7c3aed]/20 text-[#00c6d2] font-semibold' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {c}
                    </button>
                  ))
              ) : (
                popularCities.map((c) => (
                  <div
                    key={c}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-not-allowed"
                  >
                    <span className="text-sm text-gray-600">{c}</span>
                    <span className="text-[10px] text-gray-600 flex items-center gap-1 whitespace-nowrap">
                      <Lock className="w-2.5 h-2.5" />
                      Vybt Plus
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/8 mt-3">
              <label className="text-xs text-[#00c6d2] font-semibold mb-2 flex items-center gap-1">📡 Radius: <span className="text-white">{radius}km</span></label>
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
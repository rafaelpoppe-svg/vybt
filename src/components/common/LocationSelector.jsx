import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader2, Lock, X } from 'lucide-react';

const popularCities = [
  'Amsterdam', 'Athens', 'Belgrade', 'Berlin', 'Bern', 'Bratislava', 'Brussels',
  'Bucharest', 'Budapest', 'Copenhagen', 'Dublin', 'Helsinki', 'Kiev',
  'Lisbon', 'Ljubljana', 'London', 'Luxembourg', 'Madrid', 'Minsk',
  'Monaco', 'Nicosia', 'Oslo', 'Paris', 'Podgorica', 'Prague',
  'Reykjavik', 'Riga', 'Rome', 'San Marino', 'Sarajevo', 'Skopje',
  'Sofia', 'Stockholm', 'Tallinn', 'Tirana', 'Valletta', 'Vienna',
  'Vilnius', 'Warsaw', 'Zagreb',
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

  const filteredCities = popularCities.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Trigger button */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.03 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
        style={{
          background: isOpen
            ? 'linear-gradient(135deg, #00c6d2, #7c3aed)'
            : 'linear-gradient(135deg, rgba(0,198,210,0.25), rgba(124,58,237,0.25))',
          border: '1.5px solid',
          borderColor: isOpen ? 'transparent' : 'rgba(0,198,210,0.4)',
          boxShadow: isOpen ? '0 0 14px rgba(0,198,210,0.4)' : 'none',
        }}
      >
        <motion.span
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
          className="text-sm"
        >📍</motion.span>
        <div className="flex flex-col items-start leading-none">
          <span className={`text-[11px] font-bold truncate max-w-[70px] ${isOpen ? 'text-white' : 'text-[#00c6d2]'}`}>
            {city || 'Set city'}
          </span>
          <span className={`text-[9px] font-medium ${isOpen ? 'text-white/80' : 'text-gray-400'}`}>
            {radius}km radius
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180 text-white' : 'text-[#00c6d2]'}`} />
      </motion.button>

      {/* Full-screen modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsOpen(false); setSearch(''); }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            />

            {/* Bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0b0b1a 100%)',
                border: '1px solid rgba(0,198,210,0.2)',
                borderBottom: 'none',
                maxHeight: '80dvh',
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                <div>
                  <h3 className="text-white font-bold text-base">📍 Your Location</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Choose your city to see nearby plans</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setIsOpen(false); setSearch(''); }}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-300" />
                </motion.button>
              </div>

              {/* Detect location — big colourful button */}
              <div className="px-5 mb-4">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={detectLocation}
                  disabled={detecting}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-white text-sm disabled:opacity-60 transition-all"
                  style={{
                    background: detecting
                      ? 'rgba(0,198,210,0.2)'
                      : 'linear-gradient(135deg, #00c6d2 0%, #7c3aed 100%)',
                    boxShadow: detecting ? 'none' : '0 4px 20px rgba(0,198,210,0.35)',
                  }}
                >
                  {detecting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <motion.span
                      animate={{ rotate: [0, 20, -20, 0] }}
                      transition={{ repeat: Infinity, repeatDelay: 2, duration: 0.6 }}
                      className="text-xl"
                    >🧭</motion.span>
                  )}
                  {detecting ? 'Detecting your location...' : 'Use my current location'}
                </motion.button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 px-5 mb-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-gray-500 text-xs">or choose a city</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Search */}
              <div className="px-5 mb-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="🔍 Search city..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/8 text-sm text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-[#00c6d2]/60 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
              </div>

              {/* City list */}
              <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: '38dvh' }}>
                {adminMode ? (
                  <div className="space-y-1">
                    {filteredCities.map((c) => (
                      <motion.button
                        key={c}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { onCityChange(c); setIsOpen(false); setSearch(''); }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-all"
                        style={city === c ? {
                          background: 'linear-gradient(135deg, rgba(0,198,210,0.2), rgba(124,58,237,0.2))',
                          border: '1px solid rgba(0,198,210,0.4)',
                        } : {
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid transparent',
                        }}
                      >
                        <span className={city === c ? 'text-[#00c6d2] font-bold' : 'text-gray-300'}>
                          {c}
                        </span>
                        {city === c && <span className="text-[#00c6d2] text-xs font-bold">✓ Selected</span>}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredCities.map((c) => (
                      <div
                        key={c}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
                      >
                        <span className="text-sm text-gray-600">{c}</span>
                        <span className="text-[10px] text-gray-600 flex items-center gap-1 whitespace-nowrap">
                          <Lock className="w-2.5 h-2.5" />
                          Vybt Plus
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Radius slider */}
              <div className="px-5 py-4 border-t border-white/8" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-[#00c6d2] font-semibold flex items-center gap-1">
                    📡 Search radius
                  </label>
                  <span className="text-white font-bold text-sm">{radius} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={radius}
                  onChange={(e) => onRadiusChange(Number(e.target.value))}
                  className="w-full accent-[#00c6d2]"
                />
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>5 km</span>
                  <span>100 km</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
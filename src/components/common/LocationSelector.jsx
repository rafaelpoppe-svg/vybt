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

  const filteredCities = popularCities.filter(c => 
    c.toLowerCase().includes(search.toLowerCase())
  );

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

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city..."
                className="pl-9 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-1 max-h-40 overflow-y-auto mb-4">
              {filteredCities.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onCityChange(c);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    city === c
                      ? 'bg-[#00fea3]/20 text-[#00fea3]'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-800">
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
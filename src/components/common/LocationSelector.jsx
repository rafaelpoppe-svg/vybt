import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const popularCities = ['Viseu'];

export default function LocationSelector({ city, radius, onCityChange, onRadiusChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

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
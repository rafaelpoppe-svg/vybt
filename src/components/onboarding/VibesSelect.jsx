import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const vibeOptions = [
  'Techno', 'Reggaeton', 'Pop', 'House', 'Trap', 
  'Afrobeats', 'Brazilian Funk', 'Hard Techno', 
  '80s Songs', 'EDM', 'Rock', 'Disco', 
  'Curious to every style'
];

export default function VibesSelect({ selected = [], onSelect, min = 2, max = 5 }) {
  const toggleVibe = (vibe) => {
    if (selected.includes(vibe)) {
      onSelect(selected.filter(v => v !== vibe));
    } else if (selected.length < max) {
      onSelect([...selected, vibe]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">What's your vibe?</h2>
        <p className="text-gray-400 text-sm">Select {min}-{max} music styles you love</p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {vibeOptions.map((vibe) => {
          const isSelected = selected.includes(vibe);
          return (
            <motion.button
              key={vibe}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleVibe(vibe)}
              className={`px-4 py-2.5 rounded-full border-2 transition-all duration-300 flex items-center gap-2 ${
                isSelected
                  ? 'border-[#00fea3] bg-[#00fea3]/10 text-[#00fea3]'
                  : 'border-gray-700 bg-gray-900/50 text-white hover:border-gray-600'
              }`}
            >
              {isSelected && <Check className="w-4 h-4" />}
              <span className="font-medium text-sm">{vibe}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="text-center">
        <span className={`text-sm ${
          selected.length >= min ? 'text-[#00fea3]' : 'text-gray-500'
        }`}>
          {selected.length}/{max} selected
        </span>
      </div>
    </div>
  );
}
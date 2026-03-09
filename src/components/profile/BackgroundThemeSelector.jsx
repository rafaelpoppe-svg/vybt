import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const BACKGROUND_THEMES = {
  default:   { name: 'Default',    color: '#111118', accent: '#222233' },
  beer:      { name: 'Beer',       color: '#1a0e00', accent: '#3d2200' },
  dance:     { name: 'Dance',      color: '#1a0a2e', accent: '#3d1a5e' },
  champagne: { name: 'Champagne',  color: '#1c1500', accent: '#3d2e00' },
  money:     { name: 'Money',      color: '#001a0a', accent: '#003d1a' },
  luxury:    { name: 'Luxury',     color: '#0a0a1f', accent: '#1a1a4f' },
  party:     { name: 'Party',      color: '#1a0010', accent: '#3d0025' },
};

export default function BackgroundThemeSelector({ selectedTheme, onSelect }) {
  return (
    <div>
      <label className="block text-gray-400 text-sm mb-4">Profile Background Theme</label>
      <div className="flex flex-wrap gap-3">
        {Object.entries(BACKGROUND_THEMES).map(([key, theme]) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.92 }}
            onClick={() => onSelect(key)}
            className="relative flex flex-col items-center gap-1.5"
          >
            <div
              className={`w-12 h-12 rounded-2xl border-2 transition-all ${
                selectedTheme === key
                  ? 'border-[#00fea3] ring-2 ring-[#00fea3]/40'
                  : 'border-gray-700'
              }`}
              style={{
                background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.accent} 100%)`
              }}
            >
              {selectedTheme === key && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-[#00fea3]" />
                </motion.div>
              )}
            </div>
            <span className="text-[10px] text-gray-400">{theme.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
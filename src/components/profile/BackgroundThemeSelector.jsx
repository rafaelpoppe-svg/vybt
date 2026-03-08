import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const BACKGROUND_THEMES = {
  default: {
    name: 'Default',
    emoji: '✨',
    gradient: 'from-[#0b0b0b] to-[#1a1a2e]',
    description: 'Clean & Modern'
  },
  beer: {
    name: 'Beer Party',
    emoji: '🍺',
    gradient: 'from-amber-900/30 via-[#0b0b0b] to-orange-900/20',
    description: 'Cheers & Vibes'
  },
  dance: {
    name: 'Dance Floor',
    emoji: '💃',
    gradient: 'from-purple-900/30 via-[#0b0b0b] to-pink-900/20',
    description: 'Energy & Motion'
  },
  champagne: {
    name: 'Champagne',
    emoji: '🥂',
    gradient: 'from-yellow-600/20 via-[#0b0b0b] to-amber-900/20',
    description: 'Luxury & Celebration'
  },
  money: {
    name: 'Money Moves',
    emoji: '💰',
    gradient: 'from-green-900/30 via-[#0b0b0b] to-emerald-900/20',
    description: 'Success & Style'
  },
  luxury: {
    name: 'Luxury',
    emoji: '💎',
    gradient: 'from-blue-900/30 via-[#0b0b0b] to-purple-900/30',
    description: 'Premium & Exclusive'
  },
  party: {
    name: 'Party Central',
    emoji: '🎉',
    gradient: 'from-red-900/30 via-[#0b0b0b] to-yellow-900/20',
    description: 'Fun & Festive'
  }
};

export default function BackgroundThemeSelector({ selectedTheme, onSelect }) {
  return (
    <div>
      <label className="block text-gray-400 text-sm mb-4">Profile Background Theme</label>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(BACKGROUND_THEMES).map(([key, theme]) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(key)}
            className={`relative rounded-2xl p-4 transition-all ${
              selectedTheme === key
                ? 'border-2 border-[#00fea3] ring-2 ring-[#00fea3]/30'
                : 'border-2 border-gray-800 hover:border-gray-700'
            }`}
            style={{
              background: `linear-gradient(135deg, ${theme.gradient})`
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">{theme.emoji}</span>
              <div className="text-left w-full">
                <p className="text-white text-xs font-semibold truncate">{theme.name}</p>
                <p className="text-gray-400 text-[10px]">{theme.description}</p>
              </div>
            </div>

            {selectedTheme === key && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-5 h-5 bg-[#00fea3] rounded-full flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-[#0b0b0b]" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
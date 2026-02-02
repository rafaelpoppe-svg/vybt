import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';

export default function StoryCircle({ 
  user, 
  isAdd = false, 
  isHighlighted = false,
  onClick,
  size = 'md'
}) {
  const sizes = {
    sm: 'w-14 h-14',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  if (isAdd) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex flex-col items-center gap-1"
      >
        <div className={`${sizes[size]} rounded-full bg-gray-900 border-2 border-dashed border-[#00fea3] flex items-center justify-center`}>
          <Plus className="w-6 h-6 text-[#00fea3]" />
        </div>
        <span className="text-xs text-gray-400">Add</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1"
    >
      <div className={`${sizes[size]} rounded-full p-0.5 ${
        isHighlighted 
          ? 'bg-gradient-to-br from-[#542b9b] via-[#00fea3] to-[#542b9b]' 
          : 'bg-gradient-to-br from-[#00fea3] to-[#542b9b]'
      }`}>
        <div className="w-full h-full rounded-full bg-[#0b0b0b] p-0.5">
          {user?.photos?.[0] ? (
            <img 
              src={user.photos[0]} 
              alt={user.display_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.display_name?.[0] || '?'}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isHighlighted && <Sparkles className="w-3 h-3 text-[#542b9b]" />}
        <span className="text-xs text-gray-400 max-w-14 truncate">
          {user?.display_name || 'User'}
        </span>
      </div>
    </motion.button>
  );
}
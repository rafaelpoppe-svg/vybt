import React from 'react';
import { motion } from 'framer-motion';

const emojis = ['❤️', '🔥', '😍', '🎉', '👏', '💯'];

export default function StoryReactions({ 
  reactions = [], 
  currentUserId, 
  onReact,
  showPicker = true 
}) {
  const myReaction = reactions.find(r => r.user_id === currentUserId);
  
  // Count reactions by emoji
  const reactionCounts = emojis.reduce((acc, emoji) => {
    acc[emoji] = reactions.filter(r => r.emoji === emoji).length;
    return acc;
  }, {});

  const totalReactions = reactions.length;

  return (
    <div className="space-y-3">
      {/* Reaction counts */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-2">
          {emojis.map(emoji => 
            reactionCounts[emoji] > 0 && (
              <div 
                key={emoji} 
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800/80"
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-xs text-gray-400">{reactionCounts[emoji]}</span>
              </div>
            )
          )}
        </div>
      )}

      {/* Reaction picker */}
      {showPicker && (
        <div className="flex gap-2 justify-center">
          {emojis.map(emoji => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onReact(emoji)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                myReaction?.emoji === emoji 
                  ? 'bg-[#00fea3]/30 ring-2 ring-[#00fea3]' 
                  : 'bg-gray-800/80 hover:bg-gray-700'
              }`}
            >
              <span className="text-lg">{emoji}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
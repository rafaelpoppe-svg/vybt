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


    </div>
  );
}
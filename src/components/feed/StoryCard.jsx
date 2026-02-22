import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, Play, Video } from 'lucide-react';

// Random border colors for stories
const storyColors = [
  'from-purple-500 to-purple-600',
  'from-red-500 to-red-600',
  'from-yellow-400 to-yellow-500',
  'from-blue-500 to-blue-600',
  'from-green-500 to-green-600',
  'from-pink-500 to-pink-600',
  'from-sky-400 to-sky-500',
  'from-indigo-600 to-indigo-700'
];

// User's own story color
const ownStoryColor = 'from-[#00fea3] to-[#542b9b]';

// New/unviewed story color (light blue)
const newStoryColor = 'from-sky-300 to-sky-400';

export default function StoryCard({ 
  user, 
  story,
  isAdd = false, 
  isOwn = false,
  isHighlighted = false,
  isNew = false,
  colorIndex = 0,
  onClick,
  size = 'md',
  currentUserId,
  happeningPlan = null
}) {
  const sizes = {
    sm: { width: 'w-16', height: 'h-24', text: 'text-[9px]' },
    md: { width: 'w-20', height: 'h-28', text: 'text-[10px]' },
    lg: { width: 'w-24', height: 'h-32', text: 'text-xs' }
  };

  const currentSize = sizes[size];
  
  // Check if story is new (unviewed by current user)
  const isUnviewed = story && currentUserId && !story.viewed_by?.includes(currentUserId);
  const borderColor = isOwn ? ownStoryColor : (isUnviewed || isNew) ? newStoryColor : storyColors[colorIndex % storyColors.length];

  if (isAdd) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex flex-col items-center gap-1.5"
      >
        <div className={`${currentSize.width} ${currentSize.height} rounded-2xl bg-gray-900 border-2 border-dashed border-[#00fea3] flex items-center justify-center`}>
          <Plus className="w-6 h-6 text-[#00fea3]" />
        </div>
        <span className={`${currentSize.text} text-gray-400`}>Add</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5"
    >
      <div className={`${currentSize.width} ${currentSize.height} rounded-2xl p-0.5 bg-gradient-to-b ${borderColor}`}>
        <div className="w-full h-full rounded-[14px] bg-[#0b0b0b] p-0.5 overflow-hidden relative">
          {story?.media_url ? (
            <>
              <img 
                src={story.media_type === 'video' && story.thumbnail_url ? story.thumbnail_url : story.media_url} 
                alt=""
                className="w-full h-full rounded-xl object-cover"
              />
              {story.media_type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                  </div>
                </div>
              )}
            </>
          ) : user?.photos?.[0] ? (
            <img 
              src={user.photos[0]} 
              alt={user.display_name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-xl bg-gray-800 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user?.display_name?.[0] || '?'}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isHighlighted && <Sparkles className="w-3 h-3 text-[#542b9b]" />}
        {(isUnviewed || isNew) && !isOwn && (
          <span className="px-1.5 py-0.5 rounded text-[8px] bg-sky-400 text-white font-bold">NEW</span>
        )}
        <span className={`${currentSize.text} text-gray-400 max-w-16 truncate`}>
          {isOwn ? 'Your Story' : (user?.display_name || 'User')}
        </span>
      </div>
    </motion.button>
  );
}
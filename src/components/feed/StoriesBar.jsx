import React, { useState } from 'react';
import { motion } from 'framer-motion';
import StoryCircle from './StoryCircle';

const filters = ['All stories', 'Only friends', 'Highlighted'];

export default function StoriesBar({ stories = [], userProfiles = {}, onStoryClick, onAddStory, currentFilter, onFilterChange }) {
  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
        {filters.map((filter) => (
          <motion.button
            key={filter}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterChange(filter)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              currentFilter === filter
                ? 'bg-[#00fea3] text-[#0b0b0b]'
                : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            {filter}
          </motion.button>
        ))}
      </div>

      {/* Stories */}
      <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-2">
        <StoryCircle isAdd onClick={onAddStory} />
        
        {stories.map((story) => (
          <StoryCircle
            key={story.id}
            user={userProfiles[story.user_id]}
            isHighlighted={story.is_highlighted}
            onClick={() => onStoryClick(story)}
          />
        ))}
      </div>
    </div>
  );
}
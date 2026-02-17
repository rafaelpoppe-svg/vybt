import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StoryCard from './StoryCard';
import { Camera } from 'lucide-react';

const filters = ['All stories', 'Only friends', 'Highlighted'];

export default function StoriesBar({ 
  stories = [], 
  userProfiles = {}, 
  onStoryClick, 
  onAddStory, 
  currentFilter, 
  onFilterChange,
  currentUserId,
  happeningPlan = null
}) {
  // Separate own stories and others
  const ownStories = stories.filter(s => s.user_id === currentUserId);
  const otherStories = stories.filter(s => s.user_id !== currentUserId);
  
  // Shuffle other stories for random order
  const shuffledOthers = [...otherStories].sort(() => Math.random() - 0.5);

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

      {/* Stories - Vertical rectangle cards */}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
        {/* Add Story with tooltip bubble if plan is happening */}
        <div className="relative flex-shrink-0">
          <StoryCard isAdd onClick={onAddStory} />
          <AnimatePresence>
            {happeningPlan && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-48 z-50 pointer-events-none"
                style={{ bottom: 'calc(100% + 4px)', top: 'auto' }}
              >
                <div className="bg-orange-500 text-white text-[10px] font-bold rounded-xl px-2 py-1.5 text-center leading-tight shadow-lg shadow-orange-500/40">
                  🔥 Um dos seus planos está acontecendo agora! Poste já os seus stories!!
                </div>
                <div className="w-3 h-3 bg-orange-500 rotate-45 mx-auto -mt-1.5 rounded-sm" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Own stories first with special color */}
        {ownStories.map((story) => (
          <StoryCard
            key={story.id}
            user={userProfiles[story.user_id]}
            story={story}
            isOwn
            isHighlighted={story.is_highlighted}
            onClick={() => onStoryClick(story)}
          />
        ))}
        
        {/* Other stories with random colors */}
        {shuffledOthers.map((story, index) => (
          <StoryCard
            key={story.id}
            user={userProfiles[story.user_id]}
            story={story}
            colorIndex={index}
            isHighlighted={story.is_highlighted}
            onClick={() => onStoryClick(story)}
          />
        ))}
      </div>
    </div>
  );
}
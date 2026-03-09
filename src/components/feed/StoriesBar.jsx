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
        {filters.map((filter, i) => (
          <motion.button
            key={filter}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onFilterChange(filter)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              currentFilter === filter
                ? 'bg-[#00c6d2] text-[#0b0b0b] shadow-lg shadow-[#00c6d2]/30'
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            {filter}
          </motion.button>
        ))}
      </div>

      {/* Stories - Vertical rectangle cards */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ staggerChildren: 0.05 }}
        className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2"
      >
        {/* Add Story — neon blue when a plan is happening */}
        <div className="relative flex-shrink-0">
          <StoryCard isAdd onClick={onAddStory} happeningPlan={happeningPlan} />
          <AnimatePresence>
            {happeningPlan && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="absolute z-50 pointer-events-none"
                style={{ bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', width: '160px' }}
              >
                <div className="bg-[#00d4ff] text-[#0b0b0b] text-[10px] font-bold rounded-xl px-2.5 py-2 text-center leading-tight shadow-lg shadow-[#00d4ff]/40">
                  🔵 Um plano está a acontecer agora! Poste o teu Experience Story!
                </div>
                <div className="w-3 h-3 bg-[#00d4ff] rotate-45 mx-auto -mt-1.5 rounded-sm" />
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
          <motion.div
            key={story.id}
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <StoryCard
              user={userProfiles[story.user_id]}
              story={story}
              colorIndex={index}
              isHighlighted={story.is_highlighted}
              onClick={() => onStoryClick(story)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CommunityStoriesGallery({ stories, plans, profilesMap, tc, onStoryClick }) {
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  if (!stories.length) return null;

  // Group stories by plan (include all, not just last 24h — past events gallery)
  const storiesByPlan = stories.reduce((acc, s) => {
    if (!acc[s.plan_id]) acc[s.plan_id] = [];
    acc[s.plan_id].push(s);
    return acc;
  }, {});

  const planEntries = Object.entries(storiesByPlan);
  const selectedStories = selectedPlanId
    ? storiesByPlan[selectedPlanId] || []
    : stories;

  return (
    <div className="px-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4" style={{ color: tc }} />
          <span className="text-white font-bold text-sm">Event Stories</span>
          <span className="text-gray-600 text-xs">({stories.length})</span>
        </div>
      </div>

      {/* Plan filter pills */}
      {planEntries.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-3" data-hscroll>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setSelectedPlanId(null)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
            style={!selectedPlanId
              ? { background: `${tc}30`, color: tc, borderColor: `${tc}60` }
              : { background: 'transparent', color: '#6b7280', borderColor: '#374151' }}
          >
            All
          </motion.button>
          {planEntries.map(([planId, planStories]) => {
            const plan = plans.find(p => p.id === planId);
            if (!plan) return null;
            const isActive = selectedPlanId === planId;
            return (
              <motion.button
                key={planId}
                whileTap={{ scale: 0.93 }}
                onClick={() => setSelectedPlanId(isActive ? null : planId)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                style={isActive
                  ? { background: `${tc}30`, color: tc, borderColor: `${tc}60` }
                  : { background: 'transparent', color: '#6b7280', borderColor: '#374151' }}
              >
                {plan.cover_image
                  ? <img src={plan.cover_image} className="w-4 h-4 rounded object-cover" />
                  : <span>🎉</span>}
                <span className="truncate max-w-[80px]">{plan.title}</span>
                <span className="opacity-60">({planStories.length})</span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Stories grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPlanId || 'all'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-3 gap-1"
        >
          {selectedStories.slice(0, 12).map(story => {
            const profile = profilesMap[story.user_id];
            const plan = plans.find(p => p.id === story.plan_id);
            return (
              <motion.div
                key={story.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStoryClick(story.id)}
                className="aspect-[9/16] rounded-xl overflow-hidden cursor-pointer relative group"
              >
                {story.media_type === 'video'
                  ? <video src={story.media_url} className="w-full h-full object-cover" muted playsInline />
                  : <img src={story.media_url} alt="" className="w-full h-full object-cover" />}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Author */}
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-white/40 flex-shrink-0">
                    {profile?.photos?.[0]
                      ? <img src={profile.photos[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: tc }}>{profile?.display_name?.[0] || '?'}</div>}
                  </div>
                </div>

                {/* Plan badge on hover or highlighted */}
                {story.is_highlighted && (
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ background: tc }}>⭐</div>
                )}

                {/* Video indicator */}
                {story.media_type === 'video' && (
                  <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-transparent border-l-white ml-0.5" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* See all button if > 12 */}
      {selectedStories.length > 12 && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-gray-400"
        >
          +{selectedStories.length - 12} more stories
        </motion.button>
      )}
    </div>
  );
}
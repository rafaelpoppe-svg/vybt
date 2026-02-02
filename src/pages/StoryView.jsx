import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight, MapPin, Loader2 } from 'lucide-react';

export default function StoryView() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('id');
  
  const [progress, setProgress] = useState(0);

  const { data: story, isLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => base44.entities.ExperienceStory.filter({ id: storyId }),
    select: (data) => data[0],
    enabled: !!storyId
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 100),
  });

  const profilesMap = userProfiles.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  const plansMap = plans.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const storyUser = story ? profilesMap[story.user_id] : null;
  const storyPlan = story ? plansMap[story.plan_id] : null;

  // Progress timer
  useEffect(() => {
    if (!story) return;
    
    const duration = 5000; // 5 seconds per story
    const interval = 50;
    const increment = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          navigate(-1);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    // Update view count
    base44.entities.ExperienceStory.update(storyId, {
      view_count: (story.view_count || 0) + 1
    });

    return () => clearInterval(timer);
  }, [story, storyId]);

  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 p-2 z-10">
        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-white"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 px-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00fea3] to-[#542b9b] p-0.5">
            <div className="w-full h-full rounded-full bg-black overflow-hidden">
              {storyUser?.photos?.[0] ? (
                <img src={storyUser.photos[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {storyUser?.display_name?.[0] || '?'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-white font-medium text-sm">{storyUser?.display_name || 'User'}</p>
            {storyPlan && (
              <p className="text-gray-400 text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {storyPlan.title}
              </p>
            )}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-black/50"
        >
          <X className="w-6 h-6 text-white" />
        </motion.button>
      </div>

      {/* Story Content */}
      <div 
        className="flex-1 flex items-center justify-center"
        onClick={() => navigate(-1)}
      >
        {story.media_type === 'video' ? (
          <video 
            src={story.media_url} 
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <img 
            src={story.media_url} 
            alt="Story" 
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Plan info at bottom */}
      {storyPlan && (
        <div className="absolute bottom-8 left-4 right-4 z-10">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${storyPlan.id}`)}
            className="w-full p-4 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#542b9b] to-[#00fea3]/50 flex items-center justify-center">
              <span className="text-xl">🎉</span>
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-medium">{storyPlan.title}</p>
              <p className="text-gray-400 text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {storyPlan.city}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>
        </div>
      )}
    </div>
  );
}
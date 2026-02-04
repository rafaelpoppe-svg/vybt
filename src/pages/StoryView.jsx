import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, MapPin, Loader2, ChevronRight, ChevronLeft, MoreVertical, Trash2, Volume2, VolumeX } from 'lucide-react';
import StoryReactions from '../components/story/StoryReactions';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StoryView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('id');
  
  const [progress, setProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [allStories, setAllStories] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {}
    };
    getUser();
  }, []);

  const { data: allStoriesData = [], isLoading } = useQuery({
    queryKey: ['allStories'],
    queryFn: () => base44.entities.ExperienceStory.list('-created_date', 100),
  });

  const story = allStories[currentStoryIndex];

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 50),
  });

  const { data: reactions = [] } = useQuery({
    queryKey: ['storyReactions', storyId],
    queryFn: () => base44.entities.StoryReaction.filter({ story_id: storyId }),
    enabled: !!storyId
  });

  const profilesMap = userProfiles.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  const storyUser = story ? profilesMap[story.user_id] : null;
  const storyPlan = story ? plans.find(p => p.id === story.plan_id) : null;

  // Initialize stories list
  useEffect(() => {
    if (allStoriesData.length > 0 && storyId) {
      const currentIndex = allStoriesData.findIndex(s => s.id === storyId);
      setAllStories(allStoriesData);
      setCurrentStoryIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [allStoriesData, storyId]);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ExperienceStory.delete(story.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['allStories']);
      navigate(-1);
    }
  });

  const canDelete = story?.user_id === currentUser?.id;

  // Mark as viewed
  useEffect(() => {
    if (story && currentUser && !story.viewed_by?.includes(currentUser.id)) {
      const updateViews = async () => {
        const viewedBy = story.viewed_by || [];
        await base44.entities.ExperienceStory.update(storyId, {
          view_count: (story.view_count || 0) + 1,
          viewed_by: [...viewedBy, currentUser.id]
        });
      };
      updateViews();
    }
  }, [story, currentUser, storyId]);

  // Progress timer
  useEffect(() => {
    if (!story) return;
    
    setProgress(0);
    const duration = 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNext();
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [story]);

  const handleNext = () => {
    if (currentStoryIndex < allStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      navigate(-1);
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const reactMutation = useMutation({
    mutationFn: async (emoji) => {
      // Check if user already reacted
      const existingReaction = reactions.find(r => r.user_id === currentUser?.id);
      
      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          // Remove reaction
          await base44.entities.StoryReaction.delete(existingReaction.id);
        } else {
          // Update reaction
          await base44.entities.StoryReaction.update(existingReaction.id, { emoji });
        }
      } else {
        // Add new reaction
        await base44.entities.StoryReaction.create({
          story_id: storyId,
          user_id: currentUser.id,
          emoji
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['storyReactions', storyId]);
    }
  });

  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 h-1 z-10 flex gap-1 px-2 pt-2">
        {allStories.map((_, index) => (
          <div key={index} className="flex-1 h-0.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ 
                width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Navigation areas */}
      <button
        onClick={handlePrevious}
        className="absolute left-0 top-0 bottom-0 w-1/3 z-20"
        disabled={currentStoryIndex === 0}
      />
      <button
        onClick={handleNext}
        className="absolute right-0 top-0 bottom-0 w-1/3 z-20"
      />

      {/* Media */}
      <div className="absolute inset-0 flex items-center justify-center">
        {story.media_type === 'video' ? (
          <video 
            key={story.id}
            src={story.media_url} 
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted={isMuted || !story.has_audio}
            playsInline
            loop
          />
        ) : (
          <img 
            src={story.media_url} 
            alt="" 
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 px-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
              {storyUser?.photos?.[0] ? (
                <img src={storyUser.photos[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white font-bold">{storyUser?.display_name?.[0] || '?'}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-white font-medium">{storyUser?.display_name || 'User'}</p>
              <p className="text-gray-400 text-xs">{story.view_count || 0} views</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {story.media_type === 'video' && story.has_audio && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-black/50 backdrop-blur-sm"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </motion.button>
            )}

            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full bg-black/50 backdrop-blur-sm"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800">
                  <DropdownMenuItem 
                    onClick={() => deleteMutation.mutate()}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar Story
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-black/50 backdrop-blur-sm"
            >
              <X className="w-6 h-6 text-white" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10 space-y-4">
        {/* Reactions */}
        <StoryReactions
          reactions={reactions}
          currentUserId={currentUser?.id}
          onReact={(emoji) => reactMutation.mutate(emoji)}
        />

        {/* Plan link */}
        {storyPlan && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${storyPlan.id}`)}
            className="w-full p-3 rounded-xl bg-white/10 backdrop-blur-sm flex items-center gap-3"
          >
            <MapPin className="w-5 h-5 text-[#00fea3]" />
            <div className="flex-1 text-left">
              <p className="text-white font-medium">{storyPlan.title}</p>
              <p className="text-gray-400 text-xs">{storyPlan.city}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
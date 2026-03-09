import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, MapPin, Loader2, ChevronRight, ChevronLeft, MoreVertical, Trash2, Volume2, VolumeX, Flag, MessageCircle, Smile } from 'lucide-react';
import StoryReactions from '../components/story/StoryReactions';
import ReportContentModal from '../components/moderation/ReportContentModal';
import { useStoryGrouping } from '../components/story/useStoryGrouping';
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
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryInGroupIndex, setCurrentStoryInGroupIndex] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

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
    queryFn: async () => {
      const all = await base44.entities.ExperienceStory.list('-created_date', 100);
      const now = new Date();
      return all.filter(s => {
        if (s.expires_at) return new Date(s.expires_at) > now;
        return (now - new Date(s.created_date)) < 24 * 3600 * 1000;
      });
    },
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 50),
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships'],
    queryFn: () => base44.entities.Friendship.list('-created_date', 100),
  });

  // Use story grouping hook
  const { groupedStories, findStoryPosition, getStoryAt, getGroupContext } = useStoryGrouping(
    allStories,
    userProfiles,
    plans,
    currentUser,
    friendships
  );

  // Get current story from grouped structure
  const currentGroup = groupedStories[currentGroupIndex];
  const currentGroupStory = currentGroup?.stories?.[currentStoryInGroupIndex];
  const story = currentGroupStory || allStories[currentStoryIndex];

  const currentStoryId = story?.id || storyId;

  const profilesMap = userProfiles.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  const { data: reactions = [] } = useQuery({
    queryKey: ['storyReactions', currentStoryId],
    queryFn: () => base44.entities.StoryReaction.filter({ story_id: currentStoryId }),
    enabled: !!currentStoryId
  });

  const storyUser = story ? profilesMap[story.user_id] : null;
  const storyPlan = story ? plans.find(p => p.id === story.plan_id) : null;

  // Handle horizontal swipe for group navigation
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = Math.abs(touchEndY - touchStartY.current);

    // Only trigger if horizontal swipe > 50px and less vertical movement
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY * 2) {
      if (deltaX > 0) {
        // Swipe right: previous group
        if (currentGroupIndex > 0) {
          setCurrentGroupIndex(currentGroupIndex - 1);
          setCurrentStoryInGroupIndex(0);
        }
      } else {
        // Swipe left: next group
        if (currentGroupIndex < groupedStories.length - 1) {
          setCurrentGroupIndex(currentGroupIndex + 1);
          setCurrentStoryInGroupIndex(0);
        }
      }
    }
  };

  // Initialize stories list
  useEffect(() => {
    if (allStoriesData.length > 0) {
      setAllStories(allStoriesData);
      if (storyId && groupedStories.length > 0) {
        const position = findStoryPosition(storyId);
        if (position) {
          setCurrentGroupIndex(position.groupIndex);
          setCurrentStoryInGroupIndex(position.storyIndex);
        }
      }
      // Fallback to flat list if no grouping
      if (!storyId) {
        setCurrentStoryIndex(0);
      }
    }
  }, [allStoriesData, storyId, groupedStories]);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ExperienceStory.delete(story.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['allStories']);
      navigate(-1);
    }
  });

  const reportMutation = useMutation({
    mutationFn: ({ reason, details }) => base44.entities.Report.create({
      reporter_user_id: currentUser.id,
      reported_user_id: story.user_id,
      reported_plan_id: story.id,
      type: 'story',
      reason,
      details: details || '',
      status: 'pending'
    }),
    onSuccess: () => setShowReportModal(false)
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
    if (groupedStories.length > 0) {
      const group = groupedStories[currentGroupIndex];
      if (currentStoryInGroupIndex < group.stories.length - 1) {
        // Next story in group
        setCurrentStoryInGroupIndex(currentStoryInGroupIndex + 1);
      } else if (currentGroupIndex < groupedStories.length - 1) {
        // Next group
        setCurrentGroupIndex(currentGroupIndex + 1);
        setCurrentStoryInGroupIndex(0);
      } else {
        // End of all stories
        navigate(-1);
      }
    } else if (currentStoryIndex < allStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      navigate(-1);
    }
  };

  const handlePrevious = () => {
    if (groupedStories.length > 0) {
      if (currentStoryInGroupIndex > 0) {
        // Previous story in group
        setCurrentStoryInGroupIndex(currentStoryInGroupIndex - 1);
      } else if (currentGroupIndex > 0) {
        // Previous group (last story)
        setCurrentGroupIndex(currentGroupIndex - 1);
        const prevGroup = groupedStories[currentGroupIndex - 1];
        setCurrentStoryInGroupIndex(prevGroup.stories.length - 1);
      }
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const reactMutation = useMutation({
    mutationFn: async (emoji) => {
      const targetStoryId = story?.id;
      if (!targetStoryId) return;
      // Check if user already reacted to THIS story
      const existingReaction = reactions.find(r => r.user_id === currentUser?.id);
      
      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          await base44.entities.StoryReaction.delete(existingReaction.id);
        } else {
          await base44.entities.StoryReaction.update(existingReaction.id, { emoji });
        }
      } else {
        await base44.entities.StoryReaction.create({
          story_id: targetStoryId,
          user_id: currentUser.id,
          emoji
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['storyReactions', story?.id]);
    }
  });

  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black z-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 h-1 z-10 flex gap-1 px-2 pt-2">
        {currentGroup?.stories?.map((_, index) => (
          <div key={index} className="flex-1 h-0.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ 
                width: index === currentStoryInGroupIndex ? `${progress}%` : index < currentStoryInGroupIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Navigation areas — start below the header area (top-24) so buttons don't block header */}
      <button
        onClick={handlePrevious}
        className="absolute left-0 top-24 bottom-32 w-1/3 z-20"
        disabled={currentStoryInGroupIndex === 0 && currentGroupIndex === 0}
      />
      <button
        onClick={handleNext}
        className="absolute right-0 top-24 bottom-32 w-1/3 z-20"
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
      <div className="absolute top-4 left-0 right-0 px-4 z-30">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => story?.user_id && navigate(createPageUrl('UserProfile') + `?id=${story.user_id}`)}
          >
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} className="p-2 rounded-full bg-black/50 backdrop-blur-sm">
                  <MoreVertical className="w-5 h-5 text-white" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800">
                {canDelete && (
                  <DropdownMenuItem onClick={() => deleteMutation.mutate()} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar Story
                  </DropdownMenuItem>
                )}
                {!canDelete && currentUser && (
                  <DropdownMenuItem onClick={() => setShowReportModal(true)} className="text-orange-400 hover:text-orange-300">
                    <Flag className="w-4 h-4 mr-2" />
                    Denunciar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

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
            className="w-full p-3 rounded-xl backdrop-blur-sm flex items-center gap-3 border border-white/10"
            style={{ backgroundColor: storyPlan.theme_color ? `${storyPlan.theme_color}33` : 'rgba(255,255,255,0.1)' }}
          >
            {storyPlan.group_image ? (
              <img src={storyPlan.group_image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-white/20" />
            ) : storyPlan.cover_image ? (
              <img src={storyPlan.cover_image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-white/20" />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                style={{ backgroundColor: storyPlan.theme_color || '#542b9b' }}
              >
                🎉
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-white font-medium">{storyPlan.title}</p>
              <p className="text-gray-300 text-xs">{storyPlan.city}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>
        )}
      </div>
    <ReportContentModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={(data) => reportMutation.mutate(data)}
        contentType="story"
        contentTitle={storyPlan?.title}
        isLoading={reportMutation.isPending}
      />
    </div>
  );
}
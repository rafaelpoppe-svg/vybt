import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, MapPin, Loader2, ChevronRight, ChevronLeft, MoreVertical, Trash2, Volume2, VolumeX, Flag, MessageCircle, Smile } from 'lucide-react';
import StoryReactions from '../components/story/StoryReactions';
import ReportContentModal from '../components/moderation/ReportContentModal';
import StoryChatInput from '../components/story/StoryChatInput';
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
  

  const [currentUser, setCurrentUser] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [allStories, setAllStories] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryInGroupIndex, setCurrentStoryInGroupIndex] = useState(0);
  const [showChatInput, setShowChatInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const isPausedRef = useRef(false);
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
    staleTime: 2 * 60 * 1000,
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
    staleTime: 5 * 60 * 1000,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 50),
    staleTime: 5 * 60 * 1000,
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships'],
    queryFn: () => base44.entities.Friendship.list('-created_date', 100),
    staleTime: 5 * 60 * 1000,
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

  const triggerFloatingEmoji = (emoji) => {
    const id = Date.now();
    setFloatingReactions(prev => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 1500);
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
  const isStoryOwner = story?.user_id === currentUser?.id;
  const canChat = !isStoryOwner && currentUser && story;

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

  // Progress timer — using CSS transition for performance (no per-frame re-render)
  const progressBarRef = useRef(null);
  const progressTimerRef = useRef(null);
  const progressStartRef = useRef(null);
  const progressPausedAtRef = useRef(null);

  const handleNextRef = useRef(null);

  const startProgress = () => {
    if (!progressBarRef.current) return;
    //REMOVER SE NÃO FUNCIONAR
    clearTimeout(progressTimerRef.current);

    progressBarRef.current.style.transition = 'none';
    progressBarRef.current.style.width = '0%';

    //REMOVER SE NÃO FUNCIONAR
    progressBarRef.current.getBoundingClientRect();

    requestAnimationFrame(() => {
      if (!progressBarRef.current) return;
      progressBarRef.current.style.transition = 'width 5s linear';
      progressBarRef.current.style.width = '100%';
    });

    clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => {
      if (!isPausedRef.current) handleNextRef.current?.();
    }, 5000);
  };

  useEffect(() => {
    if (!story) return;
    // Only auto-advance (with progress bar) when group has multiple stories
    startProgress();
    return () => {
      clearTimeout(progressTimerRef.current);
      if (progressBarRef.current) {
        progressBarRef.current.style.transition = 'none';
      }
    };
  }, [currentStoryInGroupIndex, currentGroupIndex]);

  // Keep handleNextRef always up to date
  useEffect(() => { handleNextRef.current = handleNext; });

  // Preload next story media
  useEffect(() => {
    const nextStory = groupedStories[currentGroupIndex]?.stories?.[currentStoryInGroupIndex + 1]
      || groupedStories[currentGroupIndex + 1]?.stories?.[0];
    if (nextStory?.media_url && nextStory.media_type !== 'video') {
      const img = new Image();
      img.src = nextStory.media_url;
    }
  }, [currentStoryInGroupIndex, currentGroupIndex, groupedStories]);

  const handleNext = () => {

    // REMOVER SE NÃO FUNCIONAR
    if (progressBarRef.current) {
      progressBarRef.current.style.transition = 'none';
      progressBarRef.current.style.width = '100%';
    }
    clearTimeout(progressTimerRef.current);

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

    // REMOVER SE NÃO DER CERTO
    if (progressBarRef.current) {
      progressBarRef.current.style.transition = 'none';
      progressBarRef.current.style.width = '0%';
    }
    clearTimeout(progressTimerRef.current);


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
      setShowEmojiPicker(false);
    }
  });

  const emojis = ['❤️', '🔥', '😍', '🎉', '👏', '💯'];

  const handleEmojiSelect = (emoji) => {
    reactMutation.mutate(emoji);
    triggerFloatingEmoji(emoji);
  };

  const handleChatSent = async () => {
    setShowChatInput(false);
    // Navigate to chat after message sent
    const user = await base44.auth.me();
    if (user && storyUser) {
      navigate(createPageUrl('Chat'));
    }
  };

  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-b from-black via-black to-black z-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars — only shown when group has multiple stories */}
        <div className="absolute top-0 left-0 right-0 h-1 z-10 flex gap-1 px-2 pt-2">
          {currentGroup.stories.map((_, index) => (
            <div key={`${currentGroupIndex}-${index}`} className="flex-1 h-0.5 bg-gray-800 rounded-full overflow-hidden">
              {index < currentStoryInGroupIndex ? (
                <div className="h-full bg-white" style={{ width: '100%' }} />
              ) : index === currentStoryInGroupIndex ? (
                <div ref={progressBarRef} className="h-full bg-white" style={{ width: '0%' }} />
              ) : (
                <div className="h-full bg-white" style={{ width: '0%' }} />
              )}
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

      {/* Pause Zone - Stay in the middle of the screen */}
      <div
        className="absolute top-24 bottom-32 z-20"
        style={{ left: '33%', right: '33%' }}
        onTouchStart={() => { isPausedRef.current = true; }}
        onTouchEnd={() => { isPausedRef.current = false; }}
        onClick={() => { isPausedRef.current = !isPausedRef.current}}
      />

      {/* Media */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {story.media_type === 'video' ? (
          <video
            key={story.id}
            src={story.media_url}
            className="h-full w-auto max-w-[400px] object-cover rounded-none md:rounded-2xl"
            autoPlay
            muted={isMuted || !story.has_audio}
            playsInline
            loop
          />
        ) : (
          <img
            key={story.id}
            src={story.media_url}
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-auto max-w-[400px] object-cover rounded-none md:rounded-2xl"
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
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-100 space-y-4">
        {/* Reactions - only for viewers, not story owner */}
        {!isStoryOwner && (
          <StoryReactions
            reactions={reactions}
            currentUserId={currentUser?.id}
            onReact={(emoji) => reactMutation.mutate(emoji)}
          />
        )}

        {/* Plan link */}
        {storyPlan && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${storyPlan.id}`)}
            className="w-full p-3 rounded-xl backdrop-blur-sm flex items-center gap-3 border-2 hover:shadow-lg transition-all"
            style={{
              backgroundColor: storyPlan.theme_color ? `${storyPlan.theme_color}44` : 'rgba(255,255,255,0.1)',
              borderColor: storyPlan.theme_color ? `${storyPlan.theme_color}80` : 'rgba(255,255,255,0.2)'
            }}
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

        {/* Interaction Buttons */}
        <div className="flex gap-3 items-center">
          {canChat && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowChatInput(true)}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#00c6d2]/80 to-[#00c6d2] text-[#0b0b0b] font-bold backdrop-blur-sm border border-[#00c6d2]/50 hover:shadow-lg hover:shadow-[#00c6d2]/30 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Send Chat</span>
            </motion.button>
          )}

          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-3 rounded-xl bg-gradient-to-r from-[#542b9b]/80 to-[#542b9b] text-white backdrop-blur-sm border border-[#542b9b]/50 hover:shadow-lg hover:shadow-[#542b9b]/30 transition-all"
            >
              <span className="text-xl">😊</span>
            </motion.button>

            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute bottom-16 right-0 bg-gray-900 border border-[#542b9b]/50 rounded-xl p-2 z-50 flex flex-col gap-2"
              >
                {emojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileTap={{ scale: 1.3 }}
                    onClick={(e) => { e.stopPropagation(); handleEmojiSelect(emoji); }}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {showChatInput && canChat && (
          <StoryChatInput
            storyId={story?.id}
            storyUser={storyUser}
            onMessageSent={handleChatSent}
            onClose={() => setShowChatInput(false)}
          />
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
      {/* Floating reaction emojis */}
      {floatingReactions.map(({ id, emoji }) => (
        <motion.div
          key={id}
          className="fixed text-4xl pointer-events-none z-50"
          style={{ bottom: '20%', right: '10%' }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: -400, opacity: 0, scale: 1.5 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
}
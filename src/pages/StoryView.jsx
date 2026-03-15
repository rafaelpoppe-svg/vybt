import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Cube/card flip transition (Instagram-style group change)
const CUBE_DURATION = 0.35;

function getCubeVariants(direction) {
  // direction: 1 = going forward (left swipe), -1 = going backward (right swipe)
  return {
    enter: (dir) => ({
      rotateY: dir > 0 ? 60 : -60,
      x: dir > 0 ? '40%' : '-40%',
      opacity: 0,
      scale: 0.85,
      zIndex: 0,
    }),
    center: {
      rotateY: 0,
      x: 0,
      opacity: 1,
      scale: 1,
      zIndex: 1,
      transition: { duration: CUBE_DURATION, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: (dir) => ({
      rotateY: dir > 0 ? -60 : 60,
      x: dir > 0 ? '-40%' : '40%',
      opacity: 0,
      scale: 0.85,
      zIndex: 0,
      transition: { duration: CUBE_DURATION, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };
}

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

  // Cube transition state
  const [cubeDirection, setCubeDirection] = useState(1); // 1=forward, -1=backward
  const [isCubeTransition, setIsCubeTransition] = useState(false);
  // Key to trigger AnimatePresence re-mount on group change
  const [groupKey, setGroupKey] = useState(0);

  const isPausedRef = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwipeRef = useRef(false);

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

  const { groupedStories, findStoryPosition } = useStoryGrouping(
    allStories,
    userProfiles,
    plans,
    currentUser,
    friendships
  );

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

  // ── Group change helpers ──────────────────────────────────────────────────
  const goToGroup = useCallback((newGroupIndex, newStoryIndex, direction) => {
    setCubeDirection(direction);
    setIsCubeTransition(true);
    setCurrentGroupIndex(newGroupIndex);
    setCurrentStoryInGroupIndex(newStoryIndex);
    setGroupKey(k => k + 1);
    setTimeout(() => setIsCubeTransition(false), CUBE_DURATION * 1000 + 50);
  }, []);

  // ── Touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwipeRef.current = false;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = Math.abs(touchEndY - touchStartY.current);

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY * 2) {
      isSwipeRef.current = true;
      if (deltaX < 0) {
        // Swipe left → always jump to next GROUP (skip remaining stories in current group)
        if (currentGroupIndex < groupedStories.length - 1) {
          goToGroup(currentGroupIndex + 1, 0, 1);
        } else {
          goToGroup(currentGroupIndex, 0, 1); // trigger cube exit anim then leave
          setTimeout(() => navigate(-1), CUBE_DURATION * 1000);
        }
      } else {
        // Swipe right → always jump to previous GROUP
        if (currentGroupIndex > 0) {
          const pg = groupedStories[currentGroupIndex - 1];
          goToGroup(currentGroupIndex - 1, pg.stories.length - 1, -1);
        } else {
          goToGroup(currentGroupIndex, 0, -1); // trigger cube exit anim then leave
          setTimeout(() => navigate(-1), CUBE_DURATION * 1000);
        }
      }
    }
  };

  const triggerFloatingEmoji = (emoji) => {
    const id = Date.now();
    setFloatingReactions(prev => [...prev, { id, emoji }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 1500);
  };

  useEffect(() => {
    if (allStoriesData.length > 0) setAllStories(allStoriesData);
  }, [allStoriesData]);

  useEffect(() => {
    if (storyId && groupedStories.length > 0 && allStories.length > 0) {
      const position = findStoryPosition(storyId);
      if (position) {
        setCurrentGroupIndex(position.groupIndex);
        setCurrentStoryInGroupIndex(position.storyIndex);
      }
    }
  }, [storyId, groupedStories]);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ExperienceStory.delete(story.id),
    onSuccess: () => {
      queryClient.removeQueries(['allStories']);
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

  // Progress bar
  const progressBarRef = useRef(null);
  const progressTimerRef = useRef(null);
  const handleNextRef = useRef(null);

  const startProgress = () => {
    clearTimeout(progressTimerRef.current);
    if (!progressBarRef.current) return;

    progressBarRef.current.style.transition = 'none';
    progressBarRef.current.style.width = '0%';
    // Force reflow so the transition reset applies before starting
    progressBarRef.current.getBoundingClientRect();

    requestAnimationFrame(() => {
      if (!progressBarRef.current) return;
      progressBarRef.current.style.transition = 'width 5s linear';
      progressBarRef.current.style.width = '100%';
    });

    progressTimerRef.current = setTimeout(() => {
      if (!isPausedRef.current) handleNextRef.current?.();
    }, 5000);
  };

  useEffect(() => {
    if (!story) return;
    // Small delay when groupKey changes (cube animation) to let DOM settle
    const delay = groupKey > 0 ? 50 : 0;
    const t = setTimeout(() => startProgress(), delay);
    return () => {
      clearTimeout(t);
      clearTimeout(progressTimerRef.current);
    };
  }, [currentStoryInGroupIndex, currentGroupIndex, groupKey]);

  useEffect(() => { handleNextRef.current = handleNext; });

  // Preload next
  useEffect(() => {
    const nextStory = groupedStories[currentGroupIndex]?.stories?.[currentStoryInGroupIndex + 1]
      || groupedStories[currentGroupIndex + 1]?.stories?.[0];
    if (nextStory?.media_url && nextStory.media_type !== 'video') {
      const img = new Image();
      img.src = nextStory.media_url;
    }
  }, [currentStoryInGroupIndex, currentGroupIndex, groupedStories]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (progressBarRef.current) {
      progressBarRef.current.style.transition = 'none';
      progressBarRef.current.style.width = '100%';
    }
    clearTimeout(progressTimerRef.current);

    if (groupedStories.length > 0) {
      const group = groupedStories[currentGroupIndex];
      if (currentStoryInGroupIndex < group.stories.length - 1) {
        // Next story within same group → no cube
        setCurrentStoryInGroupIndex(currentStoryInGroupIndex + 1);
      } else if (currentGroupIndex < groupedStories.length - 1) {
        // Next group → cube
        goToGroup(currentGroupIndex + 1, 0, 1);
      } else {
        // End of all → cube exit
        setCubeDirection(1);
        setIsCubeTransition(true);
        setTimeout(() => { setIsCubeTransition(false); navigate(-1); }, CUBE_DURATION * 1000);
      }
    } else if (currentStoryIndex < allStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      navigate(-1);
    }
  };

  const handlePrevious = () => {
    if (progressBarRef.current) {
      progressBarRef.current.style.transition = 'none';
      progressBarRef.current.style.width = '0%';
    }
    clearTimeout(progressTimerRef.current);

    if (groupedStories.length > 0) {
      if (currentStoryInGroupIndex > 0) {
        // Previous story within same group → no cube
        setCurrentStoryInGroupIndex(currentStoryInGroupIndex - 1);
      } else if (currentGroupIndex > 0) {
        // Previous group → cube
        const prevGroup = groupedStories[currentGroupIndex - 1];
        goToGroup(currentGroupIndex - 1, prevGroup.stories.length - 1, -1);
      } else {
        // First group first story → cube exit
        setCubeDirection(-1);
        setIsCubeTransition(true);
        setTimeout(() => { setIsCubeTransition(false); navigate(-1); }, CUBE_DURATION * 1000);
      }
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handleClickNext = () => {
    if (isSwipeRef.current) { isSwipeRef.current = false; return; }
    handleNext();
  };

  const handleClickPrev = () => {
    if (isSwipeRef.current) { isSwipeRef.current = false; return; }
    handlePrevious();
  };

  const reactMutation = useMutation({
    mutationFn: async (emoji) => {
      const targetStoryId = story?.id;
      if (!targetStoryId) return;
      const existingReaction = reactions.find(r => r.user_id === currentUser?.id);
      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          await base44.entities.StoryReaction.delete(existingReaction.id);
        } else {
          await base44.entities.StoryReaction.update(existingReaction.id, { emoji });
        }
      } else {
        await base44.entities.StoryReaction.create({ story_id: targetStoryId, user_id: currentUser.id, emoji });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['storyReactions', story?.id]);
      setShowEmojiPicker(false);
    }
  });

  const emojis = ['❤️', '🔥', '😍', '🎉', '👏', '💯'];
  const handleEmojiSelect = (emoji) => { reactMutation.mutate(emoji); triggerFloatingEmoji(emoji); };
  const handleChatSent = async () => {
    setShowChatInput(false);
    const user = await base44.auth.me();
    if (user && storyUser) navigate(createPageUrl('Chat'));
  };

  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
      </div>
    );
  }

  // ── Desktop side groups ───────────────────────────────────────────────────
  const prevGroup = currentGroupIndex > 0 ? groupedStories[currentGroupIndex - 1] : null;
  const nextGroup = currentGroupIndex < groupedStories.length - 1 ? groupedStories[currentGroupIndex + 1] : null;

  const SideGroupCard = ({ group, side }) => {
    const preview = group?.stories?.[0];
    const user = preview ? profilesMap[preview.user_id] : null;
    const isLeft = side === 'left';
    return (
      <div
        className="hidden md:flex absolute top-0 bottom-0 items-center justify-center cursor-pointer z-10"
        style={{ [isLeft ? 'right' : 'left']: '100%', width: '180px', paddingLeft: isLeft ? 0 : 16, paddingRight: isLeft ? 16 : 0 }}
        onClick={() => isLeft
          ? goToGroup(currentGroupIndex - 1, 0, -1)
          : goToGroup(currentGroupIndex + 1, 0, 1)
        }
      >
        <div className="relative w-full h-[70%] rounded-2xl overflow-hidden opacity-60 hover:opacity-80 transition-opacity"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          {preview?.media_url ? (
            <img src={preview.media_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-800" />
          )}
          {/* User overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                {user?.photos?.[0]
                  ? <img src={user.photos[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-[#542b9b] flex items-center justify-center text-[10px] text-white font-bold">{user?.display_name?.[0] || '?'}</div>
                }
              </div>
              <p className="text-white text-xs font-medium truncate">{user?.display_name || ''}</p>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-1/2 -translate-y-1/2" style={{ [isLeft ? 'left' : 'right']: 8 }}>
            {isLeft
              ? <ChevronLeft className="w-6 h-6 text-white drop-shadow" />
              : <ChevronRight className="w-6 h-6 text-white drop-shadow" />
            }
          </div>
        </div>
      </div>
    );
  };

  // ── Cube variants ─────────────────────────────────────────────────────────
  const cubeVariants = getCubeVariants(cubeDirection);

  return (
    <div
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Desktop: centered story with side groups */}
      <div className="w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
        <div className="relative w-full md:w-[400px] h-full md:h-[90vh] md:rounded-2xl overflow-hidden"
          style={{ transformStyle: 'preserve-3d' }}>

          {/* Side group cards (desktop only) */}
          {prevGroup && <SideGroupCard group={prevGroup} side="left" />}
          {nextGroup && <SideGroupCard group={nextGroup} side="right" />}

          {/* Progress bars — outside AnimatePresence so ref never loses DOM */}
          <div className="absolute top-0 left-0 right-0 h-1 z-30 flex gap-1 px-2 pt-2">
            {(currentGroup?.stories || []).map((_, index) => (
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

          {/* Main story with cube animation on group change */}
          <AnimatePresence custom={cubeDirection} mode="sync">
            <motion.div
              key={`group-${groupKey}`}
              custom={cubeDirection}
              variants={cubeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
              style={{ transformOrigin: cubeDirection > 0 ? 'left center' : 'right center', transformStyle: 'preserve-3d' }}
            >
              {/* Progress bars placeholder (invisible, space taken by outer) */}

              {/* Navigation tap zones */}
              <button
                onClick={handleClickPrev}
                className="absolute left-0 top-24 bottom-32 w-1/3 z-20"
              />
              <button
                onClick={handleClickNext}
                className="absolute right-0 top-24 bottom-32 w-1/3 z-20"
              />

              {/* Pause zone */}
              <div
                className="absolute top-24 bottom-32 z-20"
                style={{ left: '33%', right: '33%' }}
                onTouchStart={() => { isPausedRef.current = true; }}
                onTouchEnd={() => { isPausedRef.current = false; }}
                onClick={() => { isPausedRef.current = !isPausedRef.current; }}
              />

              {/* Media */}
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                {story.media_type === 'video' ? (
                  <video
                    key={story.id}
                    src={story.media_url}
                    className="h-full w-full object-cover"
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
                    className="h-full w-full object-cover"
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
                      <p className="text-gray-400 text-xs">{(() => {
                        const diff = Date.now() - new Date(story.created_date).getTime();
                        const mins = Math.floor(diff / 60000);
                        const hours = Math.floor(mins / 60);
                        const days = Math.floor(hours / 24);
                        if (days > 0) return `há ${days}d`;
                        if (hours > 0) return `há ${hours}h`;
                        if (mins > 0) return `há ${mins}min`;
                        return 'agora mesmo';
                      })()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {story.media_type === 'video' && story.has_audio && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 rounded-full bg-black/50 backdrop-blur-sm"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
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
                            <Trash2 className="w-4 h-4 mr-2" />Deletar Story
                          </DropdownMenuItem>
                        )}
                        {!canDelete && currentUser && (
                          <DropdownMenuItem onClick={() => setShowReportModal(true)} className="text-orange-400 hover:text-orange-300">
                            <Flag className="w-4 h-4 mr-2" />Denunciar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { queryClient.removeQueries(['allStories']); navigate(-1); }}
                      className="p-2 rounded-full bg-black/50 backdrop-blur-sm"
                    >
                      <X className="w-6 h-6 text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Bottom section */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-30 space-y-4">
                {!isStoryOwner && (
                  <StoryReactions
                    reactions={reactions}
                    currentUserId={currentUser?.id}
                    onReact={(emoji) => reactMutation.mutate(emoji)}
                  />
                )}
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
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ backgroundColor: storyPlan.theme_color || '#542b9b' }}>🎉</div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{storyPlan.title}</p>
                      <p className="text-gray-300 text-xs">{storyPlan.city}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </motion.button>
                )}
                <div className="flex gap-3 items-center">
                  {canChat && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowChatInput(true)}
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#00c6d2]/80 to-[#00c6d2] text-[#0b0b0b] font-bold backdrop-blur-sm border border-[#00c6d2]/50 hover:shadow-lg hover:shadow-[#00c6d2]/30 transition-all"
                    >
                      <MessageCircle className="w-5 h-5" /><span>Send Chat</span>
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
                          >{emoji}</motion.button>
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
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ReportContentModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={(data) => reportMutation.mutate(data)}
        contentType="story"
        contentTitle={storyPlan?.title}
        isLoading={reportMutation.isPending}
      />

      {/* Floating reactions */}
      {floatingReactions.map(({ id, emoji }) => (
        <motion.div
          key={id}
          className="fixed text-4xl pointer-events-none z-50"
          style={{ bottom: '20%', right: '10%' }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: -400, opacity: 0, scale: 1.5 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >{emoji}</motion.div>
      ))}
    </div>
  );
}
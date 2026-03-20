import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, ChevronRight, ChevronLeft, MoreVertical, Trash2, Volume2, VolumeX, Flag, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StoryReactions from './StoryReactions';
import ReportContentModal from '../moderation/ReportContentModal';
import StoryChatInput from './StoryChatInput';
import { useStoryGrouping } from './useStoryGrouping';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notifyStoryReaction } from '../notifications/NotificationTriggers';

function getCubeWrapperStyle(progress, direction) {
  const p = Math.abs(progress);
  const angle = direction >= 0 ? -90 * p : 90 * p;
  return {
    position: 'absolute', inset: 0,
    transformStyle: 'preserve-3d',
    transform: `rotateY(${angle}deg)`,
    willChange: 'transform',
  };
}

/**
 * Core StoryView logic — usable both as a page and as an overlay.
 * Props:
 *   initialStoryId: string  — which story to open first
 *   onClose: () => void     — called when user closes (X button or last story)
 */
export default function StoryViewContent({ initialStoryId, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
  const [videoLoading, setVideoLoading] = useState(false);
  const videoRef = useRef(null);

  const [dragProgress, setDragProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [cubeDirection, setCubeDirection] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [groupKey, setGroupKey] = useState(0);

  const dragProgressRef = useRef(0);
  const animFrameRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isDragHorizontal = useRef(null);
  const isPausedRef = useRef(false);
  const screenW = useRef(window.innerWidth);

  useEffect(() => {
    const onResize = () => { screenW.current = window.innerWidth; };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
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
    allStories, userProfiles, plans, currentUser, friendships
  );

  const currentGroup = groupedStories[currentGroupIndex];
  const currentGroupStory = currentGroup?.stories?.[currentStoryInGroupIndex];
  const story = currentGroupStory || allStories[currentStoryIndex];
  const currentStoryId = story?.id || initialStoryId;

  const profilesMap = userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});

  const { data: reactions = [] } = useQuery({
    queryKey: ['storyReactions', currentStoryId],
    queryFn: () => base44.entities.StoryReaction.filter({ story_id: currentStoryId }),
    enabled: !!currentStoryId,
  });

  const storyUser = story ? profilesMap[story.user_id] : null;
  const storyPlan = story ? plans.find(p => p.id === story.plan_id) : null;

  const getAdjacentGroup = (dir) => {
    if (dir > 0) return currentGroupIndex < groupedStories.length - 1 ? groupedStories[currentGroupIndex + 1] : null;
    return currentGroupIndex > 0 ? groupedStories[currentGroupIndex - 1] : null;
  };
  const adjacentGroup = isDragging || isAnimating ? getAdjacentGroup(cubeDirection) : null;
  const adjacentStory = adjacentGroup?.stories?.[cubeDirection > 0 ? 0 : adjacentGroup.stories.length - 1];

  const animateCubeTo = useCallback((targetProgress, onDone) => {
    const startProg = dragProgressRef.current;
    const startTime = performance.now();
    const duration = 220;
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const val = startProg + (targetProgress - startProg) * eased;
      dragProgressRef.current = val;
      setDragProgress(val);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        dragProgressRef.current = targetProgress;
        setDragProgress(targetProgress);
        onDone?.();
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const commitGroupChange = useCallback((dir) => {
    const target = dir > 0 ? 1 : -1;
    setIsAnimating(true);
    animateCubeTo(target, () => {
      const newGroupIdx = currentGroupIndex + dir;
      const newStoryIdx = dir > 0 ? 0 : (groupedStories[newGroupIdx]?.stories?.length ?? 1) - 1;
      dragProgressRef.current = 0;
      setDragProgress(0);
      setIsDragging(false);
      setIsAnimating(false);
      setCurrentGroupIndex(newGroupIdx);
      setCurrentStoryInGroupIndex(newStoryIdx);
      setGroupKey(k => k + 1);
    });
  }, [currentGroupIndex, groupedStories, animateCubeTo]);

  const cancelDrag = useCallback(() => {
    setIsAnimating(true);
    animateCubeTo(0, () => {
      dragProgressRef.current = 0;
      setDragProgress(0);
      setIsDragging(false);
      setIsAnimating(false);
    });
  }, [animateCubeTo]);

  const handleTouchStart = (e) => {
    if (isAnimating) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isDragHorizontal.current = null;
  };

  const handleTouchMove = useCallback((e) => {
    if (isAnimating) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (isDragHorizontal.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      isDragHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isDragHorizontal.current) return;
    e.preventDefault();
    const dir = dx < 0 ? 1 : -1;
    const adjacentExists = dir > 0 ? currentGroupIndex < groupedStories.length - 1 : currentGroupIndex > 0;
    if (!isDragging) { setCubeDirection(dir); setIsDragging(true); }
    const raw = dx / screenW.current;
    let progress = -raw;
    if (!adjacentExists) progress *= 0.15;
    progress = Math.max(-1, Math.min(1, progress));
    dragProgressRef.current = progress;
    setDragProgress(progress);
    isPausedRef.current = true;
  }, [isAnimating, isDragging, currentGroupIndex, groupedStories]);

  const handleTouchEnd = useCallback((e) => {
    isPausedRef.current = false;
    if (!isDragging) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dt = Date.now() - touchStartTime.current;
    const velocity = Math.abs(dx) / dt;
    const absProgress = Math.abs(dragProgressRef.current);
    const dir = dragProgressRef.current > 0 ? 1 : -1;
    const adjacentExists = dir > 0 ? currentGroupIndex < groupedStories.length - 1 : currentGroupIndex > 0;
    if (adjacentExists && (absProgress > 0.35 || velocity > 0.4)) commitGroupChange(dir);
    else cancelDrag();
  }, [isDragging, currentGroupIndex, groupedStories, commitGroupChange, cancelDrag]);

  const triggerFloatingEmoji = (emoji) => {
    const id = Date.now();
    setFloatingReactions(prev => [...prev, { id, emoji }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 1500);
  };

  useEffect(() => {
    if (allStoriesData.length > 0) setAllStories(allStoriesData);
  }, [allStoriesData]);

  useEffect(() => {
    if (initialStoryId && groupedStories.length > 0 && allStories.length > 0) {
      const position = findStoryPosition(initialStoryId);
      if (position) {
        setCurrentGroupIndex(position.groupIndex);
        setCurrentStoryInGroupIndex(position.storyIndex);
      }
    }
  }, [initialStoryId, groupedStories]);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ExperienceStory.delete(story.id),
    onSuccess: () => { queryClient.removeQueries(['allStories']); queryClient.invalidateQueries(['allStories']); onClose(); }
  });

  const reportMutation = useMutation({
    mutationFn: ({ reason, details }) => base44.entities.Report.create({
      reporter_user_id: currentUser.id, reported_user_id: story.user_id,
      reported_plan_id: story.id, type: 'story', reason, details: details || '', status: 'pending'
    }),
    onSuccess: () => setShowReportModal(false)
  });

  const canDelete = story?.user_id === currentUser?.id;
  const isStoryOwner = story?.user_id === currentUser?.id;
  const canChat = !isStoryOwner && currentUser && story;

  useEffect(() => {
    if (story && currentUser && !story.viewed_by?.includes(currentUser.id)) {
      const viewedBy = story.viewed_by || [];
      base44.entities.ExperienceStory.update(story.id, {
        view_count: (story.view_count || 0) + 1,
        viewed_by: [...viewedBy, currentUser.id]
      });
    }
  }, [story?.id, currentUser?.id]);

  const progressBarRef = useRef(null);
  const progressTimerRef = useRef(null);
  const handleNextRef = useRef(null);
  const progressRafRef = useRef(null);
  const videoProgressStartRef = useRef(null);

  // For images: fixed 5s progress animation
  const startImageProgress = useCallback((duration = 5000) => {
    clearTimeout(progressTimerRef.current);
    cancelAnimationFrame(progressRafRef.current);
    if (!progressBarRef.current) return;
    progressBarRef.current.style.transition = 'none';
    progressBarRef.current.style.width = '0%';
    progressBarRef.current.getBoundingClientRect();
    requestAnimationFrame(() => {
      if (!progressBarRef.current) return;
      progressBarRef.current.style.transition = `width ${duration / 1000}s linear`;
      progressBarRef.current.style.width = '100%';
    });
    progressTimerRef.current = setTimeout(() => {
      if (!isPausedRef.current) handleNextRef.current?.();
    }, duration);
  }, []);

  // For videos: sync progress bar with actual video currentTime
  const startVideoProgress = useCallback(() => {
    clearTimeout(progressTimerRef.current);
    cancelAnimationFrame(progressRafRef.current);
    if (!progressBarRef.current) return;
    progressBarRef.current.style.transition = 'none';
    progressBarRef.current.style.width = '0%';

    const tick = () => {
      const video = videoRef.current;
      if (!video || !progressBarRef.current) return;
      if (!isPausedRef.current && video.duration > 0) {
        const pct = (video.currentTime / video.duration) * 100;
        progressBarRef.current.style.transition = 'none';
        progressBarRef.current.style.width = `${pct}%`;
        if (pct >= 99.5) {
          handleNextRef.current?.();
          return;
        }
      }
      progressRafRef.current = requestAnimationFrame(tick);
    };
    progressRafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!story) return;
    cancelAnimationFrame(progressRafRef.current);
    clearTimeout(progressTimerRef.current);
    if (story.media_type === 'video') {
      setVideoLoading(true);
      // progress will start once video can play (onCanPlay)
    } else {
      setVideoLoading(false);
      const t = setTimeout(() => startImageProgress(), groupKey > 0 ? 50 : 0);
      return () => { clearTimeout(t); clearTimeout(progressTimerRef.current); cancelAnimationFrame(progressRafRef.current); };
    }
    return () => { clearTimeout(progressTimerRef.current); cancelAnimationFrame(progressRafRef.current); };
  }, [currentStoryInGroupIndex, currentGroupIndex, groupKey]);

  useEffect(() => { handleNextRef.current = handleNext; });

  // When mute state changes while video is playing, sync muted attribute
  useEffect(() => {
    if (videoRef.current && story?.media_type === 'video') {
      videoRef.current.muted = isMuted || !story.has_audio;
    }
  }, [isMuted]);

  // Prefetch next 2 stories aggressively
  useEffect(() => {
    const getNext = (gi, si, offset) => {
      let g = gi, s = si + offset;
      if (s >= (groupedStories[g]?.stories?.length || 0)) { g += 1; s = 0; }
      return groupedStories[g]?.stories?.[s] || null;
    };
    [getNext(currentGroupIndex, currentStoryInGroupIndex, 1), getNext(currentGroupIndex, currentStoryInGroupIndex, 2)].forEach(next => {
      if (!next?.media_url) return;
      if (next.media_type !== 'video') {
        const img = new Image();
        img.fetchPriority = 'high';
        img.src = next.media_url;
      } else {
        // Hidden video element forces browser to buffer next video
        const vid = document.createElement('video');
        vid.src = next.media_url;
        vid.preload = 'auto';
        vid.muted = true;
        vid.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
        vid.id = `prefetch-${next.id}`;
        if (!document.getElementById(`prefetch-${next.id}`)) {
          document.body.appendChild(vid);
          setTimeout(() => { try { document.body.removeChild(vid); } catch {} }, 15000);
        }
      }
    });
  }, [currentStoryInGroupIndex, currentGroupIndex, groupedStories]);

  const goToGroupCube = useCallback((newGroupIndex, newStoryIndex, dir) => {
    setCubeDirection(dir);
    setIsDragging(true);
    setIsAnimating(true);
    dragProgressRef.current = 0;
    setDragProgress(0);
    const target = dir > 0 ? 1 : -1;
    const startTime = performance.now();
    const duration = 280;
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const val = target * eased;
      dragProgressRef.current = val;
      setDragProgress(val);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        dragProgressRef.current = 0;
        setDragProgress(0);
        setIsDragging(false);
        setIsAnimating(false);
        setCurrentGroupIndex(newGroupIndex);
        setCurrentStoryInGroupIndex(newStoryIndex);
        setGroupKey(k => k + 1);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const handleNext = () => {
    if (progressBarRef.current) { progressBarRef.current.style.transition = 'none'; progressBarRef.current.style.width = '100%'; }
    clearTimeout(progressTimerRef.current);
    if (groupedStories.length > 0) {
      const group = groupedStories[currentGroupIndex];
      if (currentStoryInGroupIndex < group.stories.length - 1) {
        setCurrentStoryInGroupIndex(currentStoryInGroupIndex + 1);
      } else if (currentGroupIndex < groupedStories.length - 1) {
        goToGroupCube(currentGroupIndex + 1, 0, 1);
      } else {
        onClose();
      }
    } else if (currentStoryIndex < allStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (progressBarRef.current) { progressBarRef.current.style.transition = 'none'; progressBarRef.current.style.width = '0%'; }
    clearTimeout(progressTimerRef.current);
    if (groupedStories.length > 0) {
      if (currentStoryInGroupIndex > 0) {
        setCurrentStoryInGroupIndex(currentStoryInGroupIndex - 1);
      } else if (currentGroupIndex > 0) {
        const prevGroup = groupedStories[currentGroupIndex - 1];
        goToGroupCube(currentGroupIndex - 1, prevGroup.stories.length - 1, -1);
      } else {
        goToGroupCube(currentGroupIndex, 0, -1);
        setTimeout(() => onClose(), 300);
      }
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const reactMutation = useMutation({
    mutationFn: async (emoji) => {
      const targetStoryId = story?.id;
      if (!targetStoryId || !currentUser) return;
      const existingReaction = reactions.find(r => r.user_id === currentUser.id);
      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          await base44.entities.StoryReaction.delete(existingReaction.id);
        } else {
          await base44.entities.StoryReaction.update(existingReaction.id, { emoji });
          // notify owner about the new emoji
          if (story.user_id !== currentUser.id) {
            const myProfiles = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
            const myName = myProfiles[0]?.display_name || currentUser.full_name || 'Alguém';
            await notifyStoryReaction(story.user_id, currentUser.id, myName, emoji, targetStoryId);
          }
        }
      } else {
        await base44.entities.StoryReaction.create({ story_id: targetStoryId, user_id: currentUser.id, emoji });
        // notify story owner
        if (story.user_id !== currentUser.id) {
          const myProfiles = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
          const myName = myProfiles[0]?.display_name || currentUser.full_name || 'Alguém';
          await notifyStoryReaction(story.user_id, currentUser.id, myName, emoji, targetStoryId);
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries(['storyReactions', story?.id]); setShowEmojiPicker(false); }
  });

  const emojis = ['❤️', '🔥', '😍', '🎉', '👏', '💯'];
  const handleEmojiSelect = (emoji) => {
    reactMutation.mutate(emoji);
    triggerFloatingEmoji(emoji);
    setShowEmojiPicker(false);
    isPausedRef.current = false;
  };

  if (isLoading || !story) {
    return (
      <div className="fixed inset-0 bg-[#0b0b0b] flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
      </div>
    );
  }

  const prevGroup = currentGroupIndex > 0 ? groupedStories[currentGroupIndex - 1] : null;
  const nextGroup = currentGroupIndex < groupedStories.length - 1 ? groupedStories[currentGroupIndex + 1] : null;

  const SideGroupCard = ({ group, side }) => {
    const preview = group?.stories?.[0];
    const user = preview ? profilesMap[preview.user_id] : null;
    const isLeft = side === 'left';
    return (
      <div className="relative w-[150px] h-[65vh] rounded-2xl overflow-hidden opacity-60 hover:opacity-90 transition-opacity"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
        {preview?.media_url ? <img src={preview.media_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800" />}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              {user?.photos?.[0] ? <img src={user.photos[0]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-[#542b9b] flex items-center justify-center text-[10px] text-white font-bold">{user?.display_name?.[0] || '?'}</div>}
            </div>
            <p className="text-white text-xs font-medium truncate">{user?.display_name || ''}</p>
          </div>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2" style={{ [isLeft ? 'left' : 'right']: 8 }}>
          {isLeft ? <ChevronLeft className="w-6 h-6 text-white drop-shadow" /> : <ChevronRight className="w-6 h-6 text-white drop-shadow" />}
        </div>
      </div>
    );
  };

  const absProgress = Math.abs(dragProgress);
  const dragDir = dragProgress !== 0 ? (dragProgress > 0 ? 1 : -1) : cubeDirection;
  const showCube = (isDragging || isAnimating) && absProgress > 0;

  return (
    <div
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full h-full flex items-center justify-center relative">
        {prevGroup && (
          <div className="hidden md:flex absolute top-0 bottom-0 items-center justify-center cursor-pointer z-20"
            style={{ right: 'calc(50% + 200px)', width: '180px' }}
            onClick={() => goToGroupCube(currentGroupIndex - 1, 0, -1)}>
            <SideGroupCard group={prevGroup} side="left" />
          </div>
        )}
        {nextGroup && (
          <div className="hidden md:flex absolute top-0 bottom-0 items-center justify-center cursor-pointer z-20"
            style={{ left: 'calc(50% + 200px)', width: '180px' }}
            onClick={() => goToGroupCube(currentGroupIndex + 1, 0, 1)}>
            <SideGroupCard group={nextGroup} side="right" />
          </div>
        )}

        <div className="relative w-full md:w-[400px] h-full md:h-[90vh] md:rounded-2xl overflow-hidden"
          style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}>

          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-40 flex gap-1 px-2 pt-2">
            {(currentGroup?.stories || []).map((_, index) => (
              <div key={`${currentGroupIndex}-${index}`} className="flex-1 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                {index < currentStoryInGroupIndex
                  ? <div className="h-full bg-white w-full" />
                  : index === currentStoryInGroupIndex
                    ? <div ref={progressBarRef} className="h-full bg-white" style={{ width: '0%' }} />
                    : <div className="h-full bg-white w-0" />}
              </div>
            ))}
          </div>

          {/* 3D cube wrapper */}
          <div className="absolute inset-0"
            style={showCube ? getCubeWrapperStyle(dragProgress, dragDir) : { position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>

            {/* Adjacent face */}
            {showCube && adjacentStory && (() => {
              const cubeR = `${window.innerWidth <= 768 ? window.innerWidth : 400}px`;
              const adjAngle = dragDir >= 0 ? 90 : -90;
              return (
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: `rotateY(${adjAngle}deg) translateZ(calc(${cubeR} / 2))`, zIndex: 2 }}>
                  <div className="absolute inset-0 bg-black">
                    {adjacentStory.media_type === 'video'
                      ? <video src={adjacentStory.media_url} className="h-full w-full object-cover" muted playsInline />
                      : <img src={adjacentStory.media_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                </div>
              );
            })()}

            {/* Current face */}
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              transform: showCube ? `translateZ(calc(${window.innerWidth <= 768 ? window.innerWidth : 400}px / 2))` : 'none',
              zIndex: 1,
            }}>
              <button onClick={handlePrevious} className="absolute left-0 top-24 bottom-32 w-1/3 z-20" />
              <button onClick={handleNext} className="absolute right-0 top-24 bottom-32 w-1/3 z-20" />
              <div className="absolute top-24 bottom-32 z-20" style={{ left: '33%', right: '33%' }}
                onTouchStart={() => { isPausedRef.current = true; }}
                onTouchEnd={() => { isPausedRef.current = false; }}
                onClick={() => { isPausedRef.current = !isPausedRef.current; }} />

              {/* Media */}
              <div className="absolute inset-0 bg-black">
                {story.media_type === 'video'
                  ? <>
                      {videoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                      <video
                        key={story.id}
                        ref={videoRef}
                        src={story.media_url}
                        className="h-full w-full object-cover"
                        muted={isMuted || !story.has_audio}
                        playsInline
                        preload="auto"
                        onLoadStart={() => setVideoLoading(true)}
                        onCanPlay={(e) => {
                          setVideoLoading(false);
                          const vid = e.target;
                          // Must be muted for autoplay on mobile without user gesture
                          vid.muted = isMuted || !story.has_audio;
                          vid.play().catch(() => {
                            // fallback: mute and retry
                            vid.muted = true;
                            vid.play().catch(() => {});
                          });
                          startVideoProgress();
                        }}
                        onError={() => setVideoLoading(false)}
                      />
                    </>
                  : <img key={story.id} src={story.media_url} alt="" loading="eager" decoding="async" fetchPriority="high" className="h-full w-full object-cover" />}
              </div>

              {showCube && (
                <div className="absolute inset-0 pointer-events-none z-10" style={{
                  background: dragDir > 0
                    ? `linear-gradient(to left, rgba(0,0,0,${0.5 * absProgress}) 0%, transparent 40%)`
                    : `linear-gradient(to right, rgba(0,0,0,${0.5 * absProgress}) 0%, transparent 40%)`
                }} />
              )}

              {/* Header */}
              <div className="absolute top-4 left-0 right-0 px-4 z-30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer"
                    onClick={() => story?.user_id && navigate(createPageUrl('UserProfile') + `?id=${story.user_id}`)}>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                      {storyUser?.photos?.[0]
                        ? <img src={storyUser.photos[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><span className="text-white font-bold">{storyUser?.display_name?.[0] || '?'}</span></div>}
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
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-full bg-black/50 backdrop-blur-sm">
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
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => { queryClient.removeQueries(['allStories']); onClose(); }}
                      className="p-2 rounded-full bg-black/50 backdrop-blur-sm">
                      <X className="w-6 h-6 text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-30 space-y-4">
                {!isStoryOwner && (
                  <StoryReactions reactions={reactions} currentUserId={currentUser?.id} onReact={(emoji) => reactMutation.mutate(emoji)} />
                )}
                {storyPlan && (
                  <div className="flex justify-start">
                    <motion.button whileHover={{ scale: 1.03, x: 2 }} whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${storyPlan.id}`)}
                      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full backdrop-blur-md border transition-all max-w-[70%]"
                      style={{ backgroundColor: storyPlan.theme_color ? `${storyPlan.theme_color}33` : 'rgba(0,0,0,0.45)', borderColor: storyPlan.theme_color ? `${storyPlan.theme_color}66` : 'rgba(255,255,255,0.15)' }}>
                      <div className="flex-shrink-0">
                        {storyPlan.group_image ? <img src={storyPlan.group_image} alt="" className="w-7 h-7 rounded-full object-cover border border-white/20" />
                          : storyPlan.cover_image ? <img src={storyPlan.cover_image} alt="" className="w-7 h-7 rounded-full object-cover border border-white/20" />
                          : <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: storyPlan.theme_color || '#542b9b' }}>🎉</div>}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-white text-xs font-semibold truncate leading-tight">{storyPlan.title}</p>
                        <p className="text-gray-300 text-[10px] truncate leading-tight">{storyPlan.city}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    </motion.button>
                  </div>
                )}
                <div className="flex gap-3 items-center">
                  {canChat && (
                    <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}
                      onClick={() => { setShowChatInput(true); isPausedRef.current = true; }}
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-transparent text-white font-semibold backdrop-blur-sm border border-white/60">
                      <MessageCircle className="w-5 h-5" /><span>Reply to {storyUser?.display_name || 'user'}</span>
                    </motion.button>
                  )}
                  <div className="relative">
                    <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}
                      onClick={() => { setShowEmojiPicker(v => !v); isPausedRef.current = !showEmojiPicker; }}
                      className="p-3 rounded-xl bg-transparent text-white backdrop-blur-sm border border-white/60 flex items-center justify-center">
                      <span className="text-xl">🤍</span>
                    </motion.button>
                    {showEmojiPicker && (
                      <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute bottom-16 right-0 bg-gray-900 border border-[#542b9b]/50 rounded-xl p-2 z-50 flex flex-col gap-2">
                        {emojis.map((emoji) => (
                          <motion.button key={emoji} whileTap={{ scale: 1.3 }}
                            onClick={(e) => { e.stopPropagation(); handleEmojiSelect(emoji); }}
                            className="text-2xl hover:scale-125 transition-transform">{emoji}</motion.button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>
                {showChatInput && canChat && (
                  <StoryChatInput story={story} storyUser={storyUser}
                    onMessageSent={() => { setShowChatInput(false); isPausedRef.current = false; }}
                    onClose={() => { setShowChatInput(false); isPausedRef.current = false; }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportContentModal isOpen={showReportModal} onClose={() => setShowReportModal(false)}
        onReport={(data) => reportMutation.mutate(data)}
        contentType="story" contentTitle={storyPlan?.title} isLoading={reportMutation.isPending} />

      {floatingReactions.map(({ id, emoji }) => (
        <motion.div key={id} className="fixed text-4xl pointer-events-none z-50" style={{ bottom: '20%', right: '10%' }}
          initial={{ y: 0, opacity: 1, scale: 1 }} animate={{ y: -400, opacity: 0, scale: 1.5 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}>{emoji}</motion.div>
      ))}
    </div>
  );
}
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, ChevronRight, ChevronLeft, MoreVertical, Trash2, Volume2, VolumeX, Flag, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StoryReactions from '../components/story/StoryReactions';
import ReportContentModal from '../components/moderation/ReportContentModal';
import StoryChatInput from '../components/story/StoryChatInput';
import { useStoryGrouping } from '../components/story/useStoryGrouping';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Real 3D cube geometry ────────────────────────────────────────────────────
// Instagram-style cube: both faces share ONE perspective on the parent container.
// The cube has a radius (half the width). Each face is offset by that radius on Z,
// then rotated so they meet at a 90° angle — exactly like a physical cube corner.
//
// progress: 0..1 (forward) or 0..-1 (backward)
// direction: 1 = going forward (swipe left), -1 = going backward (swipe right)
//
// Face angles:
//   current:  starts at 0° → ends at -90° (forward) or +90° (backward)
//   adjacent: starts at +90° (forward) or -90° (backward) → ends at 0°

// ─── Instagram cube geometry ──────────────────────────────────────────────────
// Two faces pivot from the shared vertical edge between them.
// Forward (swipe left):
//   current  → pivot RIGHT edge, rotates from 0° to -90°
//   adjacent → pivot LEFT edge,  rotates from +90° to 0°
// Backward (swipe right):
//   current  → pivot LEFT edge,  rotates from 0° to +90°
//   adjacent → pivot RIGHT edge, rotates from -90° to 0°
function getCubeFaceStyle(role, progress, direction) {
  const p = Math.abs(progress); // 0..1

  if (role === 'current') {
    if (direction >= 0) {
      // Forward (swipe left → next): current exits to the LEFT, pivots on LEFT edge
      return {
        position: 'absolute', inset: 0,
        transformOrigin: 'left center',
        transform: `rotateY(${90 * p}deg)`,
        backfaceVisibility: 'hidden',
        zIndex: 1,
        willChange: 'transform',
      };
    } else {
      // Backward (swipe right → prev): current exits to the RIGHT, pivots on RIGHT edge
      return {
        position: 'absolute', inset: 0,
        transformOrigin: 'right center',
        transform: `rotateY(${-90 * p}deg)`,
        backfaceVisibility: 'hidden',
        zIndex: 1,
        willChange: 'transform',
      };
    }
  } else {
    if (direction >= 0) {
      // Forward: adjacent enters from the RIGHT, pivots on RIGHT edge
      return {
        position: 'absolute', inset: 0,
        transformOrigin: 'right center',
        transform: `rotateY(${-90 + 90 * p}deg)`,
        backfaceVisibility: 'hidden',
        zIndex: 2,
        willChange: 'transform',
      };
    } else {
      // Backward: adjacent enters from the LEFT, pivots on LEFT edge
      return {
        position: 'absolute', inset: 0,
        transformOrigin: 'left center',
        transform: `rotateY(${90 - 90 * p}deg)`,
        backfaceVisibility: 'hidden',
        zIndex: 2,
        willChange: 'transform',
      };
    }
  }
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

  // 3D cube drag state
  const [dragProgress, setDragProgress] = useState(0); // -1..0..1
  const [isDragging, setIsDragging] = useState(false);
  const [cubeDirection, setCubeDirection] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingGroupIndex, setPendingGroupIndex] = useState(null);
  const [pendingStoryIndex, setPendingStoryIndex] = useState(null);
  const [groupKey, setGroupKey] = useState(0);

  const dragProgressRef = useRef(0);
  const animFrameRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isDragHorizontal = useRef(null); // null = undecided
  const isPausedRef = useRef(false);
  const screenW = useRef(window.innerWidth);

  useEffect(() => {
    const onResize = () => { screenW.current = window.innerWidth; };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      try { const user = await base44.auth.me(); setCurrentUser(user); } catch (e) {}
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
    allStories, userProfiles, plans, currentUser, friendships
  );

  const currentGroup = groupedStories[currentGroupIndex];
  const currentGroupStory = currentGroup?.stories?.[currentStoryInGroupIndex];
  const story = currentGroupStory || allStories[currentStoryIndex];
  const currentStoryId = story?.id || storyId;

  const profilesMap = userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});

  const { data: reactions = [] } = useQuery({
    queryKey: ['storyReactions', currentStoryId],
    queryFn: () => base44.entities.StoryReaction.filter({ story_id: currentStoryId }),
    enabled: !!currentStoryId,
  });

  const storyUser = story ? profilesMap[story.user_id] : null;
  const storyPlan = story ? plans.find(p => p.id === story.plan_id) : null;

  // ── Adjacent group for cube face ──────────────────────────────────────────
  const getAdjacentGroup = (dir) => {
    if (dir > 0) return currentGroupIndex < groupedStories.length - 1 ? groupedStories[currentGroupIndex + 1] : null;
    return currentGroupIndex > 0 ? groupedStories[currentGroupIndex - 1] : null;
  };
  const adjacentGroup = isDragging || isAnimating ? getAdjacentGroup(cubeDirection) : null;
  const adjacentStory = adjacentGroup?.stories?.[cubeDirection > 0 ? 0 : adjacentGroup.stories.length - 1];

  // ── Animate cube to completion or bounce back ─────────────────────────────
  const animateCubeTo = useCallback((targetProgress, onDone) => {
    const startProg = dragProgressRef.current;
    const startTime = performance.now();
    const duration = 220; // ms

    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut
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
      // Commit: switch group
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

  // ── Touch handlers ────────────────────────────────────────────────────────
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

    // Decide direction once
    if (isDragHorizontal.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      isDragHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isDragHorizontal.current) return;

    e.preventDefault();

    const dir = dx < 0 ? 1 : -1; // 1=forward, -1=backward
    const adjacentExists = dir > 0
      ? currentGroupIndex < groupedStories.length - 1
      : currentGroupIndex > 0;

    if (!isDragging) {
      setCubeDirection(dir);
      setIsDragging(true);
    }

    // progress: 0..1 (forward) or 0..-1 (backward)
    const raw = dx / screenW.current;
    let progress = -raw; // invert: swiping left = positive progress forward
    if (!adjacentExists) progress *= 0.15; // rubber band if no adjacent
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
    const velocity = Math.abs(dx) / dt; // px/ms
    const absProgress = Math.abs(dragProgressRef.current);
    const dir = dragProgressRef.current > 0 ? 1 : -1;
    const adjacentExists = dir > 0
      ? currentGroupIndex < groupedStories.length - 1
      : currentGroupIndex > 0;

    if (adjacentExists && (absProgress > 0.35 || velocity > 0.4)) {
      commitGroupChange(dir);
    } else {
      cancelDrag();
    }
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
    onSuccess: () => { queryClient.removeQueries(['allStories']); queryClient.invalidateQueries(['allStories']); navigate(-1); }
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
      base44.entities.ExperienceStory.update(storyId, {
        view_count: (story.view_count || 0) + 1,
        viewed_by: [...viewedBy, currentUser.id]
      });
    }
  }, [story, currentUser, storyId]);

  // ── Progress bar ─────────────────────────────────────────────────────────
  const progressBarRef = useRef(null);
  const progressTimerRef = useRef(null);
  const handleNextRef = useRef(null);

  const startProgress = useCallback(() => {
    clearTimeout(progressTimerRef.current);
    if (!progressBarRef.current) return;
    progressBarRef.current.style.transition = 'none';
    progressBarRef.current.style.width = '0%';
    progressBarRef.current.getBoundingClientRect();
    requestAnimationFrame(() => {
      if (!progressBarRef.current) return;
      progressBarRef.current.style.transition = 'width 5s linear';
      progressBarRef.current.style.width = '100%';
    });
    progressTimerRef.current = setTimeout(() => {
      if (!isPausedRef.current) handleNextRef.current?.();
    }, 5000);
  }, []);

  useEffect(() => {
    if (!story) return;
    const t = setTimeout(() => startProgress(), groupKey > 0 ? 50 : 0);
    return () => { clearTimeout(t); clearTimeout(progressTimerRef.current); };
  }, [currentStoryInGroupIndex, currentGroupIndex, groupKey]);

  useEffect(() => { handleNextRef.current = handleNext; });

  useEffect(() => {
    const nextStory = groupedStories[currentGroupIndex]?.stories?.[currentStoryInGroupIndex + 1]
      || groupedStories[currentGroupIndex + 1]?.stories?.[0];
    if (nextStory?.media_url && nextStory.media_type !== 'video') {
      const img = new Image(); img.src = nextStory.media_url;
    }
  }, [currentStoryInGroupIndex, currentGroupIndex, groupedStories]);

  // ── Navigation (tap) ──────────────────────────────────────────────────────
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
        // Always advance to next group, regardless of type
        goToGroupCube(currentGroupIndex + 1, 0, 1);
      } else {
        // Last story of last group — exit
        navigate(-1);
      }
    } else if (currentStoryIndex < allStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      navigate(-1);
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
        setTimeout(() => navigate(-1), 300);
      }
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const reactMutation = useMutation({
    mutationFn: async (emoji) => {
      const targetStoryId = story?.id;
      if (!targetStoryId) return;
      const existingReaction = reactions.find(r => r.user_id === currentUser?.id);
      if (existingReaction) {
        if (existingReaction.emoji === emoji) await base44.entities.StoryReaction.delete(existingReaction.id);
        else await base44.entities.StoryReaction.update(existingReaction.id, { emoji });
      } else {
        await base44.entities.StoryReaction.create({ story_id: targetStoryId, user_id: currentUser.id, emoji });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries(['storyReactions', story?.id]); setShowEmojiPicker(false); }
  });

  const emojis = ['❤️', '🔥', '😍', '🎉', '👏', '💯'];
  const handleEmojiSelect = (emoji) => {
    reactMutation.mutate(emoji);
    triggerFloatingEmoji(emoji);
    // Resume after sending emoji
    setShowEmojiPicker(false);
    isPausedRef.current = false;
  };

  const handleOpenChat = () => {
    setShowChatInput(true);
    isPausedRef.current = true;
  };

  const handleCloseChat = () => {
    setShowChatInput(false);
    isPausedRef.current = false;
  };

  const handleOpenEmoji = () => {
    setShowEmojiPicker(true);
    isPausedRef.current = true;
  };

  const handleCloseEmoji = () => {
    setShowEmojiPicker(false);
    isPausedRef.current = false;
  };

  const handleChatSent = async () => {
    handleCloseChat();
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
      <div className="relative w-[150px] h-[65vh] rounded-2xl overflow-hidden opacity-60 hover:opacity-90 transition-opacity"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
        {preview?.media_url
          ? <img src={preview.media_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gray-800" />}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              {user?.photos?.[0]
                ? <img src={user.photos[0]} alt="" className="w-full h-full object-cover" />
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

  // ── Compute 3D styles ─────────────────────────────────────────────────────
  const absProgress = Math.abs(dragProgress);
  // dragProgress: positive = forward (next), negative = backward (prev)
  const dragDir = dragProgress !== 0 ? (dragProgress > 0 ? 1 : -1) : cubeDirection;
  const showCube = (isDragging || isAnimating) && absProgress > 0;

  const currentFaceStyle = showCube
    ? getCubeFaceStyle('current', absProgress, dragDir)
    : { position: 'absolute', inset: 0 };

  const adjacentFaceStyle = showCube && adjacentStory
    ? getCubeFaceStyle('adjacent', absProgress, dragDir)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full h-full flex items-center justify-center relative">
        {/* Desktop side group cards — OUTSIDE the clipped container so they're visible */}
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

        {/* Outer clip container — clips the cube as it rotates */}
        <div
          className="relative w-full md:w-[400px] h-full md:h-[90vh] md:rounded-2xl overflow-hidden"
          style={{ perspective: '900px', perspectiveOrigin: '50% 120%' }}
        >

          {/* Progress bars — always outside cube, never re-mounts */}
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

          {/* 3D cube wrapper — both faces live here, sharing the same perspective */}
          <div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Adjacent face (next/prev group preview) */}
            {adjacentFaceStyle && adjacentStory && (
              <div style={adjacentFaceStyle}>
                <div className="absolute inset-0 bg-black">
                  {adjacentStory.media_type === 'video'
                    ? <video src={adjacentStory.media_url} className="h-full w-full object-cover" muted playsInline />
                    : <img src={adjacentStory.media_url} alt="" className="h-full w-full object-cover" />}
                </div>
              </div>
            )}

          {/* Current face */}
          <div style={currentFaceStyle}>
            {/* Tap nav zones */}
            <button onClick={handlePrevious} className="absolute left-0 top-24 bottom-32 w-1/3 z-20" />
            <button onClick={handleNext} className="absolute right-0 top-24 bottom-32 w-1/3 z-20" />

            {/* Pause zone */}
            <div
              className="absolute top-24 bottom-32 z-20"
              style={{ left: '33%', right: '33%' }}
              onTouchStart={() => { isPausedRef.current = true; }}
              onTouchEnd={() => { isPausedRef.current = false; }}
              onClick={() => { isPausedRef.current = !isPausedRef.current; }}
            />

            {/* Media */}
            <div className="absolute inset-0 bg-black">
              {story.media_type === 'video'
                ? <video key={story.id} src={story.media_url} className="h-full w-full object-cover" autoPlay muted={isMuted || !story.has_audio} playsInline loop />
                : <img key={story.id} src={story.media_url} alt="" loading="eager" decoding="async" className="h-full w-full object-cover" />}
            </div>

            {/* Dark edge shadow while dragging — adds depth */}
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
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => story?.user_id && navigate(createPageUrl('UserProfile') + `?id=${story.user_id}`)}
                >
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
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => { queryClient.removeQueries(['allStories']); navigate(-1); }} className="p-2 rounded-full bg-black/50 backdrop-blur-sm">
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
                  <motion.button
                    whileHover={{ scale: 1.03, x: 2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${storyPlan.id}`)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full backdrop-blur-md border transition-all max-w-[70%]"
                    style={{
                      backgroundColor: storyPlan.theme_color ? `${storyPlan.theme_color}33` : 'rgba(0,0,0,0.45)',
                      borderColor: storyPlan.theme_color ? `${storyPlan.theme_color}66` : 'rgba(255,255,255,0.15)'
                    }}
                  >
                    <div className="flex-shrink-0">
                      {storyPlan.group_image
                        ? <img src={storyPlan.group_image} alt="" className="w-7 h-7 rounded-full object-cover border border-white/20" />
                        : storyPlan.cover_image
                          ? <img src={storyPlan.cover_image} alt="" className="w-7 h-7 rounded-full object-cover border border-white/20" />
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
                  <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }} onClick={handleOpenChat}
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-transparent text-white font-semibold backdrop-blur-sm border border-white/60">
                    <MessageCircle className="w-5 h-5" /><span>Reply to {storyUser?.display_name || 'user'}</span>
                  </motion.button>
                )}
                <div className="relative">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => showEmojiPicker ? handleCloseEmoji() : handleOpenEmoji()}
                    className="p-3 rounded-xl bg-gradient-to-r from-[#542b9b]/80 to-[#542b9b] text-white backdrop-blur-sm border border-[#542b9b]/50">
                    <span className="text-xl">😊</span>
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
                <StoryChatInput story={story} storyUser={storyUser} onMessageSent={handleChatSent} onClose={handleCloseChat} />
              )}
            </div>
          </div> {/* end current face */}
          </div> {/* end 3D cube wrapper */}
        </div> {/* end clip container */}
      </div>

      <ReportContentModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={(data) => reportMutation.mutate(data)}
        contentType="story" contentTitle={storyPlan?.title} isLoading={reportMutation.isPending}
      />

      {floatingReactions.map(({ id, emoji }) => (
        <motion.div key={id} className="fixed text-4xl pointer-events-none z-50" style={{ bottom: '20%', right: '10%' }}
          initial={{ y: 0, opacity: 1, scale: 1 }} animate={{ y: -400, opacity: 0, scale: 1.5 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}>{emoji}</motion.div>
      ))}
    </div>
  );
}
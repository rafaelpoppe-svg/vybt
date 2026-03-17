import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Clock, Flame, Camera, Crown, Star } from 'lucide-react';
import { formatDistanceToNow, isPast, format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const typeStyles = {
  night: { gradient: 'linear-gradient(135deg, #1a0a3e, #2d1b69)', accent: '#a78bfa', label: '🌙 Night Challenge' },
  day: { gradient: 'linear-gradient(135deg, #3d1a00, #7c3d00)', accent: '#fb923c', label: '☀️ Day Challenge' },
  weekend: { gradient: 'linear-gradient(135deg, #3d0a2e, #7c1a5c)', accent: '#f472b6', label: '🎉 Weekend Challenge' },
  custom: { gradient: 'linear-gradient(135deg, #0f172a, #1e293b)', accent: '#00c6d2', label: '⚡ Challenge' },
};

export default function CommunityChallengeDetail({ challenge, communityId, profilesMap, isAdmin, currentUser, tc, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectingWinner, setSelectingWinner] = useState(false);

  const s = typeStyles[challenge.type] || typeStyles.custom;
  const ended = challenge.ends_at ? isPast(new Date(challenge.ends_at)) : false;
  const timeLeft = !ended && challenge.ends_at ? formatDistanceToNow(new Date(challenge.ends_at), { addSuffix: false }) : null;

  // Fetch stories for the linked plan or all community plans
  const { data: challengeStories = [] } = useQuery({
    queryKey: ['challengeStories', challenge.id],
    queryFn: async () => {
      let planIds = [];
      if (challenge.plan_id) {
        planIds = [challenge.plan_id];
      } else {
        const communityPlans = await base44.entities.PartyPlan.filter({ community_id: communityId });
        planIds = communityPlans.map(p => p.id);
      }
      if (!planIds.length) return [];
      const all = await base44.entities.ExperienceStory.list('-created_date', 200);
      // Filter stories posted after challenge started
      const challengeStart = challenge.starts_at ? new Date(challenge.starts_at) : new Date(0);
      return all.filter(s =>
        planIds.includes(s.plan_id) &&
        new Date(s.created_date) >= challengeStart
      );
    },
  });

  const { data: storyReactions = [] } = useQuery({
    queryKey: ['storyReactions', challenge.id],
    queryFn: async () => {
      const allReactions = await base44.entities.StoryReaction.list('-created_date', 500);
      return allReactions.filter(r => challengeStories.some(s => s.id === r.story_id));
    },
    enabled: challengeStories.length > 0,
  });

  const scores = useCalculateChallengeScores(challengeStories, storyReactions);

  const selectWinnerMutation = useMutation({
    mutationFn: (userId) => base44.entities.CommunityChallenge.update(challenge.id, {
      winner_user_id: userId,
      status: 'ended',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['communityChallenge', communityId]);
      setSelectingWinner(false);
    },
  });

  const handleParticipate = () => {
    if (challenge.plan_id) {
      navigate(createPageUrl('AddStory') + `?planId=${challenge.plan_id}&challengeId=${challenge.id}`);
    } else {
      // Navigate to plans tab to pick a plan
      onClose();
    }
  };

  // Group stories by user and sort by view count for leaderboard
  const userStories = Object.values(
    challengeStories.reduce((acc, story) => {
      if (!acc[story.user_id]) acc[story.user_id] = { user_id: story.user_id, stories: [], totalViews: 0 };
      acc[story.user_id].stories.push(story);
      acc[story.user_id].totalViews += story.view_count || 0;
      return acc;
    }, {})
  ).sort((a, b) => b.totalViews - a.totalViews);

  const winner = challenge.winner_user_id ? profilesMap[challenge.winner_user_id] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl overflow-y-auto"
        style={{ maxHeight: '92dvh', background: '#0d0d14', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
      >
        {/* Hero header */}
        <div className="relative p-5 pb-4" style={{ background: s.gradient }}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/30">
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-black/20">
              {challenge.emoji || '🔥'}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: s.accent }}>{s.label}</p>
              <h2 className="text-white font-black text-xl leading-tight">{challenge.title}</h2>
            </div>
          </div>

          {challenge.description && (
            <p className="text-white/70 text-sm mb-3">{challenge.description}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            {timeLeft && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-400">
                <Clock className="w-3.5 h-3.5" />{timeLeft} remaining
              </span>
            )}
            {ended && <span className="text-xs font-bold text-gray-400">Challenge ended</span>}
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <Flame className="w-3.5 h-3.5 text-orange-400" />{challengeStories.length} stories submitted
            </span>
            {challenge.prize_description && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-300">
                <Trophy className="w-3.5 h-3.5" />{challenge.prize_description}
              </span>
            )}
          </div>
        </div>

        <div className="px-4 pt-4 space-y-5">
          {/* Top 3 Ranking */}
          <ChallengeRankingTop3 scores={scores} profilesMap={profilesMap} tc={tc} />

          {/* Winner announcement */}
          {winner && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="rounded-2xl p-4 border text-center"
              style={{ background: 'rgba(250,204,21,0.08)', borderColor: 'rgba(250,204,21,0.3)' }}
            >
              <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-yellow-400 text-xs font-black uppercase tracking-wider mb-1">🏆 Winner</p>
              <div className="flex items-center justify-center gap-2">
                {winner.photos?.[0]
                  ? <img src={winner.photos[0]} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400" />
                  : <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-black">{winner.display_name?.[0] || '?'}</div>}
                <p className="text-white font-black text-base">{winner.display_name || 'Unknown'}</p>
              </div>
            </motion.div>
          )}

          {/* Participate button (if not ended) */}
          {!ended && !winner && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleParticipate}
              className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white"
              style={{ background: `linear-gradient(135deg, ${s.accent}, ${tc})` }}
            >
              <Camera className="w-5 h-5" />
              Post Your Story to Participate
            </motion.button>
          )}

          {/* Leaderboard */}
          {userStories.length > 0 && (
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
                {ended ? '🏅 Final Leaderboard' : '📊 Live Leaderboard'}
              </p>
              <div className="space-y-2">
                {userStories.slice(0, 10).map((entry, idx) => {
                  const profile = profilesMap[entry.user_id];
                  const isWinner = challenge.winner_user_id === entry.user_id;
                  const medals = ['🥇', '🥈', '🥉'];
                  const topStory = entry.stories[0];

                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-2xl border"
                      style={isWinner
                        ? { background: 'rgba(250,204,21,0.08)', borderColor: 'rgba(250,204,21,0.3)' }
                        : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      {/* Rank */}
                      <span className="text-lg w-7 text-center flex-shrink-0">
                        {isWinner ? '👑' : medals[idx] || `#${idx + 1}`}
                      </span>

                      {/* Story thumbnail */}
                      {topStory && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                          {topStory.media_type === 'video'
                            ? <video src={topStory.media_url} className="w-full h-full object-cover" muted playsInline />
                            : <img src={topStory.media_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                      )}

                      {/* Profile */}
                      {profile?.photos?.[0]
                        ? <img src={profile.photos[0]} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ background: `${s.accent}30`, color: s.accent }}>
                            {profile?.display_name?.[0] || '?'}
                          </div>}

                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">{profile?.display_name || 'Member'}</p>
                        <p className="text-gray-500 text-[10px]">{entry.stories.length} {entry.stories.length === 1 ? 'story' : 'stories'} · {entry.totalViews} views</p>
                      </div>

                      {/* Admin: select winner */}
                      {isAdmin && ended && !challenge.winner_user_id && (
                        <motion.button
                          whileTap={{ scale: 0.93 }}
                          onClick={() => selectWinnerMutation.mutate(entry.user_id)}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-black text-black flex-shrink-0"
                          style={{ background: 'rgba(250,204,21,0.9)' }}
                        >
                          Pick Winner
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {challengeStories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📸</p>
              <p className="text-gray-400 font-bold">No stories yet</p>
              <p className="text-gray-600 text-xs mt-1">Be the first to participate!</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
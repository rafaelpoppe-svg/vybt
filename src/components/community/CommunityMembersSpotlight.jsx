import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShieldCheck, Crown, Flame, Trophy } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CommunityMembersSpotlight({ members, profilesMap, plans, stories, tc, currentUser, communityId }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Fetch challenge stories to count challenge completions per user
  const { data: challengeScores = [] } = useQuery({
    queryKey: ['challengeScores', communityId],
    queryFn: () => base44.entities.ChallengeScore.filter({ community_id: communityId }),
    enabled: !!communityId,
  });

  // Build score per user: admin (500) + stories in community (10 each) + challenge completions (50 each) + plan participations (20 each) + challenge score points (1 each)
  const planIds = useMemo(() => new Set((plans || []).map(p => p.id)), [plans]);

  const enriched = useMemo(() => members
    .map(m => {
      const profile = profilesMap[m.user_id];
      if (!profile) return null;
      const isAdmin = m.role === 'admin';

      // Stories posted in this community
      const communityStoriesCount = (stories || []).filter(s => s.user_id === m.user_id && planIds.has(s.plan_id)).length;
      // Challenge stories (stories with challenge_id in this community)
      const challengeStoriesCount = (stories || []).filter(s => s.user_id === m.user_id && planIds.has(s.plan_id) && !!s.challenge_id).length;
      // Challenge score points
      const userChallengeScore = challengeScores
        .filter(cs => cs.user_id === m.user_id)
        .reduce((sum, cs) => sum + (cs.total_points || 0), 0);

      const score =
        (isAdmin ? 500 : 0) +
        communityStoriesCount * 10 +
        challengeStoriesCount * 50 +
        userChallengeScore;

      return { member: m, profile, isAdmin, score, communityStoriesCount, challengeStoriesCount };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12),
  [members, profilesMap, stories, planIds, challengeScores]);

  if (!enriched.length) return null;

  const topThree = enriched.slice(0, 3);
  const rest = enriched.slice(3);

  return (
    <div className="px-4 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4" style={{ color: tc }} />
        <span className="text-white font-bold text-sm">{t.topMembers}</span>
        <span className="text-gray-600 text-xs">({members.length} {t.total})</span>
      </div>

      {/* Top 3 podium-style */}
      <div className="flex gap-2 mb-3">
        {topThree.map(({ member, profile, isAdmin, communityStoriesCount, challengeStoriesCount }, i) => (
          <motion.button
            key={member.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(createPageUrl('UserProfile') + `?id=${member.user_id}`)}
            className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl border relative"
            style={{
              background: i === 0 ? `${tc}18` : 'rgba(255,255,255,0.03)',
              borderColor: i === 0 ? `${tc}50` : 'rgba(255,255,255,0.08)',
            }}
          >
            {/* Rank badge */}
            <div
              className="absolute -top-2 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-[#0b0b0b]"
              style={{ background: i === 0 ? tc : i === 1 ? '#9ca3af' : '#b45309', color: i === 0 ? '#0b0b0b' : '#fff' }}
            >
              {i + 1}
            </div>

            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-full overflow-hidden border-2"
              style={{ borderColor: i === 0 ? tc : 'rgba(255,255,255,0.15)' }}
            >
              {profile.photos?.[0]
                ? <img src={profile.photos[0]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl font-black text-white" style={{ background: `${tc}60` }}>{profile.display_name?.[0] || '?'}</div>}
            </div>

            {/* Name */}
            <span className="text-white text-xs font-bold truncate w-full text-center">{profile.display_name || t.user}</span>

            {/* Badges */}
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {isAdmin && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: `${tc}25`, color: tc }}>
                  {t.admin.toUpperCase()}
                </span>
              )}
              {profile.is_verified && <ShieldCheck className="w-3 h-3 text-blue-400" />}
              {communityStoriesCount > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-orange-400">
                  <Flame className="w-2.5 h-2.5" />{communityStoriesCount}
                </span>
              )}
              {challengeStoriesCount > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-yellow-400">
                  <Trophy className="w-2.5 h-2.5" />{challengeStoriesCount}
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Rest as compact list */}
      {rest.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rest.map(({ member, profile, isAdmin, challengeStoriesCount }) => (
            <motion.button
              key={member.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => navigate(createPageUrl('UserProfile') + `?id=${member.user_id}`)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border"
              style={{
                background: challengeStoriesCount > 0 ? 'rgba(251,146,60,0.08)' : 'rgba(255,255,255,0.04)',
                borderColor: challengeStoriesCount > 0 ? 'rgba(251,146,60,0.25)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                {profile.photos?.[0]
                  ? <img src={profile.photos[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: tc }}>{profile.display_name?.[0] || '?'}</div>}
              </div>
              <span className="text-white text-xs">{profile.display_name || t.user}</span>
              {isAdmin && <span className="text-[8px] font-bold" style={{ color: tc }}>★</span>}
              {profile.is_verified && <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />}
              {challengeStoriesCount > 0 && <Trophy className="w-2.5 h-2.5 text-yellow-400" />}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
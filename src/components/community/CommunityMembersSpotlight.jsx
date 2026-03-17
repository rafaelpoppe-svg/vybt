import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShieldCheck, Crown, Flame } from 'lucide-react';

export default function CommunityMembersSpotlight({ members, profilesMap, plans, tc, currentUser }) {
  const navigate = useNavigate();

  if (!members.length) return null;

  // Build enriched member list with activity score
  const planParticipationMap = {}; // userId -> count of plans in this community

  // Score: admins first, then by stories/activity
  const enriched = members
    .map(m => {
      const profile = profilesMap[m.user_id];
      if (!profile) return null;
      const isAdmin = m.role === 'admin';
      const storiesCount = profile.total_stories_count || 0;
      const score = (isAdmin ? 1000 : 0) + storiesCount;
      return { member: m, profile, isAdmin, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  if (!enriched.length) return null;

  // Top 3 get special treatment
  const topThree = enriched.slice(0, 3);
  const rest = enriched.slice(3);

  return (
    <div className="px-4 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4" style={{ color: tc }} />
        <span className="text-white font-bold text-sm">Top Members</span>
        <span className="text-gray-600 text-xs">({members.length} total)</span>
      </div>

      {/* Top 3 podium-style */}
      <div className="flex gap-2 mb-3">
        {topThree.map(({ member, profile, isAdmin }, i) => (
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
            <span className="text-white text-xs font-bold truncate w-full text-center">{profile.display_name || 'User'}</span>

            {/* Badges */}
            <div className="flex items-center gap-1">
              {isAdmin && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: `${tc}25`, color: tc }}>
                  ADMIN
                </span>
              )}
              {profile.is_verified && <ShieldCheck className="w-3 h-3 text-blue-400" />}
              {(profile.total_stories_count || 0) > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-orange-400">
                  <Flame className="w-2.5 h-2.5" />{profile.total_stories_count}
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Rest as compact list */}
      {rest.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rest.map(({ member, profile, isAdmin }) => (
            <motion.button
              key={member.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => navigate(createPageUrl('UserProfile') + `?id=${member.user_id}`)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                {profile.photos?.[0]
                  ? <img src={profile.photos[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: tc }}>{profile.display_name?.[0] || '?'}</div>}
              </div>
              <span className="text-white text-xs">{profile.display_name || 'User'}</span>
              {isAdmin && <span className="text-[8px] font-bold" style={{ color: tc }}>★</span>}
              {profile.is_verified && <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
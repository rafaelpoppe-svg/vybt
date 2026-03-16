import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function CommunityCard({ community, myProfile, onClick }) {
  const tc = community.theme_color || '#00c6d2';

  // Simple match score based on shared party types + vibes
  const matchScore = React.useMemo(() => {
    if (!myProfile) return null;
    let score = 0;
    const myTypes = myProfile.party_types || [];
    const myVibes = myProfile.vibes || [];
    (community.party_types || []).forEach(t => { if (myTypes.includes(t)) score += 20; });
    (community.vibes || []).forEach(v => { if (myVibes.includes(v)) score += 10; });
    return Math.min(score, 100);
  }, [community, myProfile]);

  return (
    <motion.div whileTap={{ scale: 0.97 }} onClick={onClick}
      className="rounded-3xl overflow-hidden cursor-pointer relative border"
      style={{ borderColor: `${tc}40`, boxShadow: `0 4px 24px ${tc}20` }}>

      {/* Cover */}
      <div className="relative h-36">
        {community.cover_image
          ? <img src={community.cover_image} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: `linear-gradient(135deg, ${tc}44, #542b9b66)` }}>🏘️</div>}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, #0b0b0b 100%)` }} />

        {/* Match badge */}
        {matchScore !== null && matchScore > 0 && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-xs font-bold text-[#0b0b0b] flex items-center gap-1"
            style={{ background: tc }}>
            ❤️ {matchScore}%
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pb-3 -mt-4 relative z-10" style={{ background: '#0f0f0f' }}>
        <h3 className="text-white font-black text-base truncate">{community.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-gray-500 text-xs flex items-center gap-1"><span>📍</span>{community.city}</p>
          <p className="text-gray-500 text-xs flex items-center gap-1"><Users className="w-3 h-3" />{community.member_count || 0}</p>
        </div>
        {/* Party type tags */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {(community.party_types || []).slice(0, 2).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#0b0b0b]" style={{ background: tc }}>
              {tag}
            </span>
          ))}
        </div>
        {/* Accent bar */}
        <div className="mt-2 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${tc}, #542b9b)` }} />
      </div>
    </motion.div>
  );
}
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../common/LanguageContext';

export default function CommunityInviteCard({ communityId }) {
  const navigate = useNavigate();
  const {t} = useLanguage();
  
  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(r => r[0]),
    enabled: !!communityId,
    staleTime: 60000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: () => base44.entities.CommunityMember.filter({ community_id: communityId }),
    enabled: !!communityId,
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="w-52 h-24 rounded-2xl bg-gray-800 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (!community) return null;

  const accentColor = community.theme_color || '#00c6d2';

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(createPageUrl('CommunityView') + `?id=${communityId}`)}
      className="w-56 rounded-2xl overflow-hidden border text-left"
      style={{ borderColor: `${accentColor}44`, background: `linear-gradient(135deg, ${accentColor}15, #1a1a2e)` }}
    >
      {/* Cover image */}
      <div className="relative w-full h-24 overflow-hidden">
        {community.cover_image ? (
          <img src={community.cover_image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl"
            style={{ background: `linear-gradient(135deg, ${accentColor}44, #542b9b44)` }}>
            🏘️
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{community.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3" style={{ color: accentColor }} />
            <span className="text-xs" style={{ color: accentColor }}>`${members.length} ${t.members}`</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </div>

      {/* CTA */}
      <div className="px-3 pb-3">
        <div
          className="w-full py-1.5 rounded-xl text-center text-xs font-bold"
          style={{ background: `${accentColor}25`, color: accentColor, border: `1px solid ${accentColor}44` }}
        >
          {t.viewGroup}
        </div>
      </div>
    </motion.button>
  );
}
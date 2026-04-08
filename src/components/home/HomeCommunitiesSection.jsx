import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Users2 } from 'lucide-react';
import CommunityCard from '../community/CommunityCard';
import { useLanguage } from '../common/LanguageContext';

export default function HomeCommunitiesSection({ communities, myProfile, city, memberCommunityIds = [] }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const filtered = communities
    .filter(c => !c.is_deleted && !c.deletion_scheduled_at && !c.is_private)
    .filter(c => memberCommunityIds.includes(c.id))
    .slice(0, 6);

  if (!filtered.length) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Users2 className="w-5 h-5 text-[#00c6d2]" />
          <h2 className="text-white font-black text-base">{t.myGroups}</h2>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(createPageUrl('Explore') + '?tab=communities')}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
          {t.seeAll} <ChevronRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
      <div className="overflow-x-auto scrollbar-hide px-4" data-hscroll="1">
        <div className="flex gap-3" style={{ width: 'max-content' }}>
          {filtered.map((community, i) => (
            <motion.div key={community.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} style={{ width: 180 }}>
              <CommunityCard community={community} myProfile={myProfile}
                onClick={() => navigate(createPageUrl('CommunityView') + `?id=${community.id}`)} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
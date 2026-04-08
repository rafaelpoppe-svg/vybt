import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Plus } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

export default function HomeMyCommunitiesBar({ communities, memberCommunityIds }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const myCommunities = communities.filter(
    c => !c.is_deleted && !c.deletion_scheduled_at && memberCommunityIds.includes(c.id)
  );

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">⭐</span>
          <h3 className="text-white font-bold text-sm">{t.myGroups}</h3>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(createPageUrl('Explore') + '?tab=communities')}
          className="flex items-center gap-0.5 text-xs text-[#00c6d2]"
        >
          {t.explore} <ChevronRight className="w-3 h-3" />
        </motion.button>
      </div>

      <div className="overflow-x-auto scrollbar-hide px-4" data-hscroll="1">
        <div className="flex gap-2" style={{ width: 'max-content' }}>
          {myCommunities.length === 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(createPageUrl('Explore') + '?tab=communities')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl flex-shrink-0 border border-dashed border-gray-700 text-gray-500 text-xs"
            >
              <Plus className="w-4 h-4" />
              {t.findGroups}
            </motion.button>
          )}
          {myCommunities.map((community, i) => {
            const color = community.theme_color || '#00c6d2';
            return (
              <motion.button
                key={community.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(createPageUrl('CommunityView') + `?id=${community.id}`)}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl flex-shrink-0 relative"
                style={{ background: `${color}22`, border: `1.5px solid ${color}66`, maxWidth: 180 }}
              >
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00c6d2] flex items-center justify-center" style={{ fontSize: 8 }}>⭐</div>
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: `2px solid ${color}` }}>
                  {community.cover_image
                    ? <img src={community.cover_image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-sm"
                        style={{ background: `linear-gradient(135deg, #1a1a2e, ${color})` }}>🏘️</div>
                  }
                </div>
                <div className="text-left min-w-0">
                  <p className="text-white font-semibold text-xs truncate leading-tight">{community.name}</p>
                  <p className="text-gray-400 text-[10px] leading-tight">{community.member_count || 0} {t.membersCount}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
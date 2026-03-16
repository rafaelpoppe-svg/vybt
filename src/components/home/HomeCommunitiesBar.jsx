import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight } from 'lucide-react';

export default function HomeCommunitiesBar({ communities, city }) {
  const navigate = useNavigate();

  const filtered = communities
    .filter(c => !c.is_deleted && !c.deletion_scheduled_at)
    .filter(c => !city || c.city?.toLowerCase() === city?.toLowerCase())
    .slice(0, 8);

  if (!filtered.length) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🏘️</span>
          <h3 className="text-white font-bold text-sm">Communities Near You</h3>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(createPageUrl('Explore') + '?tab=communities')}
          className="flex items-center gap-0.5 text-xs text-[#00c6d2]"
        >
          See all <ChevronRight className="w-3 h-3" />
        </motion.button>
      </div>

      <div className="overflow-x-auto scrollbar-hide px-4" data-hscroll="1">
        <div className="flex gap-2" style={{ width: 'max-content' }}>
          {filtered.map((community, i) => {
            const color = community.theme_color || '#00c6d2';
            return (
              <motion.button
                key={community.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(createPageUrl('CommunityView') + `?id=${community.id}`)}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl flex-shrink-0"
                style={{
                  background: `${color}18`,
                  border: `1px solid ${color}44`,
                  maxWidth: 180,
                }}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                  style={{ border: `1.5px solid ${color}66` }}>
                  {community.cover_image
                    ? <img src={community.cover_image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-sm"
                        style={{ background: `linear-gradient(135deg, #1a1a2e, ${color})` }}>🏘️</div>
                  }
                </div>
                {/* Info */}
                <div className="text-left min-w-0">
                  <p className="text-white font-semibold text-xs truncate leading-tight">{community.name}</p>
                  <p className="text-gray-400 text-[10px] leading-tight">{community.member_count || 0} members</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
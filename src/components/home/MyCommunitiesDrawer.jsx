import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, Plus } from 'lucide-react';

export default function MyCommunitiesDrawer({ isOpen, onClose, communities, memberCommunityIds }) {
  const navigate = useNavigate();

  const myCommunities = communities.filter(
    c => !c.is_deleted && !c.deletion_scheduled_at && memberCommunityIds.includes(c.id)
  );

  const handleNav = (id) => {
    onClose();
    navigate(createPageUrl('CommunityView') + `?id=${id}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#111] rounded-t-3xl border-t border-white/10"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-700" />
            </div>

            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-white font-black text-lg">My Communities</h2>
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-400" />
              </motion.button>
            </div>

            <div className="px-4 pb-2 space-y-2 max-h-[60vh] overflow-y-auto">
              {myCommunities.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">🏘️</div>
                  <p className="text-gray-400 text-sm">You haven't joined any community yet</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { onClose(); navigate(createPageUrl('Explore') + '?tab=communities'); }}
                    className="mt-4 px-5 py-2.5 rounded-2xl text-sm font-bold text-[#0b0b0b]"
                    style={{ background: 'linear-gradient(135deg, #00c6d2, #542b9b)' }}
                  >
                    Explore Communities
                  </motion.button>
                </div>
              ) : (
                myCommunities.map((c, i) => {
                  const color = c.theme_color || '#00c6d2';
                  return (
                    <motion.button
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleNav(c.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl"
                      style={{ background: `${color}15`, border: `1px solid ${color}40` }}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                        style={{ border: `2px solid ${color}` }}>
                        {c.cover_image
                          ? <img src={c.cover_image} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xl"
                              style={{ background: `linear-gradient(135deg, #1a1a2e, ${color})` }}>🏘️</div>
                        }
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{c.name}</p>
                        <p className="text-gray-400 text-xs">{c.city} · {c.member_count || 0} members</p>
                      </div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    </motion.button>
                  );
                })
              )}
            </div>

            {myCommunities.length > 0 && (
              <div className="px-4 pt-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { onClose(); navigate(createPageUrl('Explore') + '?tab=communities'); }}
                  className="w-full py-3 rounded-2xl border border-dashed border-gray-700 text-gray-500 text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Find more communities
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
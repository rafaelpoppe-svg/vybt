import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, X, ShieldCheck, MapPin } from 'lucide-react';

export default function FriendsListModal({ isOpen, onClose, friendProfiles, accent = '#00c6d2' }) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-[#111] rounded-t-3xl border-t border-white/10 overflow-hidden"
            style={{ maxHeight: '75vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: accent }} />
                <span className="font-bold text-white text-base">
                  Friends <span className="text-gray-500 font-normal text-sm">({friendProfiles.length})</span>
                </span>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                className="p-1.5 rounded-xl bg-white/8 text-gray-400">
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(75vh - 65px)' }}>
              {friendProfiles.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <p className="text-4xl">👥</p>
                  <p className="text-gray-400 font-semibold">No friends yet</p>
                  <p className="text-gray-600 text-sm">Connect with people at plans</p>
                </div>
              ) : (
                <div className="p-4 space-y-2 pb-17">
                  {friendProfiles.map(fp => (
                    <motion.button
                      key={fp.user_id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { onClose(); navigate(createPageUrl('UserProfile') + `?id=${fp.user_id}`); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/8 text-left"
                    >
                      {fp.photos?.[0] ? (
                        <img src={fp.photos[0]} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-white text-sm truncate">{fp.display_name || 'User'}</p>
                          {fp.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                        </div>
                        {fp.city && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500 truncate">{fp.city}</span>
                          </div>
                        )}
                        {fp.vibes?.length > 0 && (
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: accent }}>
                            {fp.vibes.slice(0, 3).join(' · ')}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
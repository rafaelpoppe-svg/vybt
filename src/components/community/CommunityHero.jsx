import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Settings, UserPlus, MoreVertical, Flag, Loader2, Users } from 'lucide-react';

export default function CommunityHero({ community, isMember, isAdmin, tc, joinMutation, leaveMutation, onBack, onEdit, onInvite, onLeave, onReport }) {
  const [scrollY, setScrollY] = useState(0);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current?.closest('[data-scroll-root]');
    if (!el) return;
    const handler = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const parallaxOffset = Math.min(scrollY * 0.4, 60);

  return (
    <div ref={containerRef} className="relative">
      {/* Cover image with parallax */}
      <div className="relative h-72 overflow-hidden">
        {community.cover_image ? (
          <img
            src={community.cover_image}
            alt=""
            className="w-full object-cover"
            style={{ height: '120%', transform: `translateY(${parallaxOffset}px)`, objectPosition: 'center' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl" style={{ background: `linear-gradient(135deg, ${tc}66, #542b9b88)` }}>⭐</div>
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(11,11,11,0.2) 0%, transparent 40%, #0b0b0b 100%)` }} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4" style={{ paddingTop: 'max(env(safe-area-inset-top,0px),16px)' }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center" style={{ backgroundColor: 'var(--btn-bg)' }}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex gap-2">
            {isMember && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={onInvite} className="w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center" style={{ backgroundColor: 'var(--btn-bg)' }}>
                <UserPlus className="w-5 h-5 text-white" />
              </motion.button>
            )}
            {isAdmin ? (
              <motion.button whileTap={{ scale: 0.9 }} onClick={onEdit} className="w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center" style={{ backgroundColor: 'var(--btn-bg)' }}>
                <Settings className="w-5 h-5 text-white" />
              </motion.button>
            ) : (
              <div className="relative">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowReportMenu(v => !v)} className="w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center" style={{ backgroundColor: 'var(--btn-bg)' }}>
                  <MoreVertical className="w-5 h-5 text-white" />
                </motion.button>
                {showReportMenu && (
                  <div className="absolute right-0 top-12 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 min-w-[160px]">
                    <button onClick={() => { setShowReportMenu(false); onReport(); }} className="w-full px-4 py-3 text-left text-sm text-red-400 flex items-center gap-2 hover:bg-gray-800 rounded-xl">
                      <Flag className="w-4 h-4" /> Report Community
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Members badge */}
        <div className="absolute bottom-4 right-4">
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10"
            style={{ backgroundColor: 'var(--btn-bg)' }}
          >
            <Users className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-bold">{community.member_count || 0} members</span>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="px-5 -mt-6 relative z-10">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="flex items-end justify-between mb-2">
            <div className="flex-1 pr-3">
              <h1 className="text-3xl font-black text-white leading-tight">{community.name}</h1>
              <p className="text-gray-400 text-sm mt-0.5">📍 {community.city}</p>
            </div>
            {!isMember ? (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#0b0b0b] shrink-0"
                style={{ background: `linear-gradient(135deg, ${tc}, #542b9b)` }}>
                {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join 🚀'}
              </motion.button>
            ) : !isAdmin ? (
              <motion.button whileTap={{ scale: 0.95 }} onClick={onLeave}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-gray-700 shrink-0">
                Leave
              </motion.button>
            ) : null}
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap mt-2 mb-3">
            {community.party_types?.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#0b0b0b]" style={{ background: tc }}>{tag}</span>
            ))}
            {community.vibes?.slice(0, 3).map((v, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-white/10 border border-white/10">{v}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
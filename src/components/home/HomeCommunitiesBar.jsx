import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Flame } from 'lucide-react';
import { format } from 'date-fns';

export default function HomeCommunitiesBar({ plans = [] }) {
  const navigate = useNavigate();

  const today = format(new Date(), 'yyyy-MM-dd');

  const happeningPlans = plans.filter(p => p.status === 'happening');
  const upcomingPlans = plans.filter(p => p.date === today && p.status === 'upcoming');
  const todayPlans = [...happeningPlans, ...upcomingPlans].slice(0, 12);

  if (!todayPlans.length) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center px-4 mb-2 gap-1.5">
        <span className="text-sm">🗓️</span>
        <h3 className="text-white font-bold text-sm">Plans For You</h3>
      </div>

      <div className="overflow-x-auto scrollbar-hide px-4" data-hscroll="1">
        <div className="flex gap-2.5" style={{ width: 'max-content' }}>
          {todayPlans.map((plan, i) => {
            const color = plan.theme_color || '#00c6d2';
            const isLive = plan.status === 'happening';

            return (
              <motion.button
                key={plan.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
                className="relative flex-shrink-0 rounded-2xl overflow-hidden"
                style={{ width: 130, height: 90 }}
              >
                {/* Live pulsing border */}
                {isLive && (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                    style={{ border: '2.5px solid #f97316', boxShadow: '0 0 12px #f9731680' }}
                  />
                )}

                {/* Non-live border */}
                {!isLive && (
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                    style={{ border: `1.5px solid ${color}44` }}
                  />
                )}

                {/* Background */}
                {plan.cover_image ? (
                  <img src={plan.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, #1a1a2e, ${color}88)` }}
                  />
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Live badge */}
                {isLive && (
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-orange-500 rounded-full px-2 py-0.5">
                    <motion.div
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-white"
                    />
                    <span className="text-white text-[9px] font-black uppercase tracking-wide">Live</span>
                  </div>
                )}

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-2 z-20">
                  <p className="text-white font-bold text-[11px] leading-tight line-clamp-2">{plan.title}</p>
                  <p className="text-gray-300 text-[9px] mt-0.5">{plan.time}</p>
                </div>

                {/* Theme color accent bottom bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 z-20"
                  style={{ background: isLive ? '#f97316' : color }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
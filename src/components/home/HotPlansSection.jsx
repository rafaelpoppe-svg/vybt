import React from 'react';
import { motion } from 'framer-motion';
import { Flame, ChevronRight, Users, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function HotPlansSection({ plans = [], allParticipants = [], onPlanClick }) {
  const hotPlans = plans
    .filter(p => p.is_on_fire || p.recent_joins >= 100 || p.is_highlighted || p.status === 'happening')
    .slice(0, 8);

  if (hotPlans.length === 0) return null;

  const getCount = (planId) => allParticipants.filter(p => p.plan_id === planId).length;

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-lg"
          >🔥</motion.span>
          <h2 className="text-white font-bold text-base">Hot Plans Tonight</h2>
        </div>
      </div>

      <div className="space-y-2">
        {hotPlans.map((plan, idx) => {
          const isHappening = plan.status === 'happening';
          const isHot = plan.is_on_fire || plan.recent_joins >= 100;
          const count = getCount(plan.id);

          const accentColor = isHappening
            ? '#f97316'
            : isHot
            ? '#ef4444'
            : plan.is_highlighted
            ? '#a855f7'
            : '#00c6d2';

          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPlanClick(plan)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${accentColor}33` }}
            >
              {/* Cover */}
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative"
                style={{ border: `2px solid ${accentColor}66` }}>
                {plan.cover_image ? (
                  <img src={plan.cover_image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl"
                    style={{ background: `linear-gradient(135deg, #542b9b, ${accentColor})` }}>
                    🎉
                  </div>
                )}
                {/* Fire badge overlay */}
                {(isHot || isHappening) && (
                  <div className="absolute -top-1 -right-1 text-sm">
                    {isHappening ? '🟠' : '🔥'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {isHappening && (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white"
                    >● LIVE</motion.span>
                  )}
                  {isHot && !isHappening && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/80 text-white">🔥 Hot</span>
                  )}
                  {plan.is_highlighted && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/80 text-white">✨ Highlighted</span>
                  )}
                </div>
                <p className="text-white font-bold text-sm truncate">{plan.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-400 text-xs">{count}</span>
                  </div>
                  {plan.time && (
                    <span className="text-gray-500 text-xs">{plan.time}</span>
                  )}
                  {plan.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500 text-xs truncate">{plan.city}</span>
                    </div>
                  )}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
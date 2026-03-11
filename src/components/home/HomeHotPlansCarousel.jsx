import React from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronRight, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const isLiveNow = (p) => {
  if (!p.date || !p.time) return false;
  if (['ended', 'terminated', 'voting'].includes(p.status)) return false;
  const now = new Date();
  const start = new Date(`${p.date}T${p.time}:00`);
  const end = p.end_time
    ? new Date(`${p.date}T${p.end_time}:00`)
    : new Date(start.getTime() + 8 * 60 * 60 * 1000);
  return now >= start && now <= end;
};

const accentOf = (p) =>
  isLiveNow(p) ? '#f97316' : p.is_on_fire ? '#ef4444' : p.is_highlighted ? '#a855f7' : '#00c6d2';

export default function HomeHotPlansCarousel({ plans = [], allParticipants = [], onPlanClick }) {
  const navigate = useNavigate();

  const hotPlans = plans
    .filter(p => {
      if (isLiveNow(p)) return true;
      if (['ended', 'terminated', 'voting'].includes(p.status)) return false;
      return p.is_on_fire || p.recent_joins >= 100 || p.is_highlighted;
    })
    .slice(0, 10);

  if (hotPlans.length === 0) return null;

  const getCount = (id) => allParticipants.filter(p => p.plan_id === id).length;

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-base">🔥</motion.span>
          <h2 className="text-white font-bold text-sm">Hot Plans</h2>
        </div>
        <button
          onClick={() => navigate(createPageUrl('Explore'))}
          className="flex items-center gap-0.5 text-[#00c6d2] text-xs font-semibold"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1" data-hscroll="true">
        {hotPlans.map((plan, i) => {
          const accent = accentOf(plan);
          const count = getCount(plan.id);
          const isHappening = plan.status === 'happening';

          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPlanClick(plan)}
              className="flex-shrink-0 w-36 rounded-2xl overflow-hidden text-left"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}33` }}
            >
              {/* Cover */}
              <div className="relative w-full h-24">
                {plan.cover_image ? (
                  <img src={plan.cover_image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-3xl"
                    style={{ background: `linear-gradient(135deg, #1a0a2e, ${accent}88)` }}
                  >🎉</div>
                )}
                {isHappening && (
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute top-2 left-2 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                  >● LIVE</motion.div>
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-white font-bold text-xs truncate">{plan.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    <Users className="w-2.5 h-2.5 text-gray-500" />
                    <span className="text-gray-400 text-[10px]">{count}</span>
                  </div>
                  {plan.time && <span className="text-gray-500 text-[10px]">{plan.time}</span>}
                </div>
                {plan.tags?.[0] && (
                  <span
                    className="mt-1.5 inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${accent}22`, color: accent }}
                  >{plan.tags[0]}</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
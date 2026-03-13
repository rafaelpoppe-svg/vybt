import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users } from 'lucide-react';

export default function HomeHappeningNowSection({ plans = [], allParticipants = [], onPlanClick }) {
  const now = new Date();
  const happeningPlans = plans.filter(p => {
    if (!p.date || !p.time) return false;
    if (['ended', 'terminated', 'voting'].includes(p.status)) return false;
    const startDateTime = new Date(`${p.date}T${p.time}:00`);
    const endDateTime = p.end_time
      ? new Date(`${p.date}T${p.end_time}:00`)
      : new Date(startDateTime.getTime() + 8 * 60 * 60 * 1000);
    if (!(now >= startDateTime && now <= endDateTime)) return false;
    // Require ≥ 3 confirmed participants to appear in Live Now
    const goingCount = allParticipants.filter(pp => pp.plan_id === p.id).length;
    return goingCount >= 3;
  });

  if (happeningPlans.length === 0) return null;

  const getCount = (id) => allParticipants.filter(p => p.plan_id === id).length;

  return (
    <section className="mb-5 px-4">
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="w-2.5 h-2.5 rounded-full bg-orange-500"
        />
        <h2 className="text-white font-bold text-sm">Live Now</h2>
        <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
          {happeningPlans.length} {happeningPlans.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {happeningPlans.map((plan, i) => {
          const count = getCount(plan.id);
          const accent = plan.theme_color || '#f97316';

          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPlanClick(plan)}
              className="w-full rounded-2xl overflow-hidden text-left flex"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.3)' }}
            >
              {/* Cover image */}
              <div className="relative flex-shrink-0 w-20 h-20">
                {plan.cover_image ? (
                  <img src={plan.cover_image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-2xl"
                    style={{ background: `linear-gradient(135deg, #1a0a2e, ${accent}88)` }}
                  >🎉</div>
                )}
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                >● LIVE</motion.div>
              </div>

              {/* Info */}
              <div className="flex-1 px-3 py-2.5 flex flex-col justify-center">
                <p className="text-white font-bold text-sm truncate">{plan.title}</p>
                {plan.location_address && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-400 text-xs truncate">{plan.location_address}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-orange-400" />
                    <span className="text-orange-400 text-xs font-semibold">{count} a participar</span>
                  </div>
                  {plan.tags?.[0] && (
                    <span className="text-[10px] text-gray-500">{plan.tags[0]}</span>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
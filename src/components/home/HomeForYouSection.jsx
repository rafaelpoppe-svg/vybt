import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, ChevronRight, MapPin } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

export default function HomeForYouSection({ plans = [], allParticipants = [], onPlanClick }) {
  const { t } = useLanguage();

  const forYou = plans
    .filter(p => p.status !== 'terminated' && p.status !== 'ended')
    .slice(0, 6);

  if (forYou.length === 0) return null;

  const countFor = (pid) => allParticipants.filter(p => p.plan_id === pid).length;
  const accentOf = (plan) => plan.theme_color || (plan.status === 'happening' ? '#f97316' : plan.is_on_fire ? '#ef4444' : plan.is_highlighted ? '#a855f7' : '#00c6d2');

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <h2 className="text-white font-bold text-base">{t.forYou}</h2>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" data-hscroll="true">
        {forYou.map((plan, idx) => {
          const color = accentOf(plan);
          const count = countFor(plan.id);
          const isHappening = plan.status === 'happening';

          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPlanClick(plan)}
              className="flex-shrink-0 w-44 rounded-2xl overflow-hidden text-left"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33` }}
            >
              <div className="w-full h-28 relative overflow-hidden">
                {plan.cover_image
                  ? <img src={plan.cover_image} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl"
                      style={{ background: `linear-gradient(135deg,#1a1a2e,${color}66)` }}>🎉</div>
                }
                <div style={{
                  position: 'absolute', bottom: 6, right: 6,
                  width: 28, height: 28, borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 12px ${color}, 0 0 24px ${color}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12,
                }}>🎉</div>

                {isHappening && (
                  <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">● LIVE</motion.div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-white font-bold text-xs truncate">{plan.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Users className="w-2.5 h-2.5 text-gray-500" />
                    <span className="text-gray-400 text-[10px]">{count}</span>
                  </div>
                  {plan.time && <span className="text-gray-500 text-[10px]">{plan.time}</span>}
                </div>
                {plan.tags?.slice(0, 1).map(tag => (
                  <span key={tag} className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                    style={{ background: `${color}22`, color }}>
                    {tag}
                  </span>
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, ChevronRight } from 'lucide-react';
import CommunityCard from '../community/CommunityCard';

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
  p.is_highlighted ? '#a855f7' : isLiveNow(p) ? '#f97316' : p.is_on_fire ? '#ef4444' : p.theme_color || '#00c6d2';

function PlanCard({ plan, allParticipants, onClick }) {
  const accent = accentOf(plan);
  const isHappening = isLiveNow(plan);
  const count = allParticipants.filter(p => p.plan_id === plan.id).length;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex-shrink-0 w-36 rounded-2xl overflow-hidden text-left"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}33` }}
    >
      <div className="relative w-full h-24">
        {plan.cover_image ? (
          <img src={plan.cover_image} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl"
            style={{ background: `linear-gradient(135deg, #1a0a2e, ${accent}88)` }}>
            {plan.is_highlighted ? '✨' : '🎉'}
          </div>
        )}
        {isHappening && (
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}
            className="absolute top-2 left-2 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
            ● LIVE
          </motion.div>
        )}
        {plan.is_highlighted && (
          <div className="absolute top-2 right-2 text-sm" style={{ filter: 'drop-shadow(0 0 4px #a855f7)' }}>✨</div>
        )}
      </div>
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
          <span className="mt-1.5 inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: `${accent}22`, color: accent }}>{plan.tags[0]}</span>
        )}
      </div>
    </motion.button>
  );
}

export default function HomeBottomFeed({
  plans = [],
  allParticipants = [],
  communities = [],
  memberCommunityIds = [],
  myParticipations = [],
  recommendedPlans = [],
  onPlanClick,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('foryou');

  // For You tab: highlighted plans first, then recommended, then rest
  const forYouPlans = (() => {
    const active = plans.filter(p => !['ended', 'terminated', 'voting'].includes(p.status));
    const highlighted = active.filter(p => p.is_highlighted);
    const recIds = recommendedPlans.map(r => r.id);
    const recommended = active.filter(p => !p.is_highlighted && recIds.includes(p.id));
    const rest = active.filter(p => !p.is_highlighted && !recIds.includes(p.id))
      .filter(p => p.is_on_fire || p.recent_joins >= 100 || isLiveNow(p));
    return [...highlighted, ...recommended, ...rest].slice(0, 12);
  })();

  // My Space tab
  const myPlanIds = myParticipations.map(p => p.plan_id);
  const myPlans = plans.filter(p => myPlanIds.includes(p.id) && !['terminated'].includes(p.status));
  const myCommunities = communities.filter(c => memberCommunityIds.includes(c.id) && !c.is_deleted && !c.deletion_scheduled_at);

  const TABS = [
    { id: 'foryou', label: 'For You', emoji: '✨' },
    { id: 'myspace', label: 'My Space', emoji: '🗓️' },
  ];

  const tc = '#00c6d2';

  return (
    <section className="mb-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 mx-4 mb-4 w-fit">
        {TABS.map(tab => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#00c6d2] to-[#542b9b] text-white shadow-md'
                : 'text-gray-500'
            }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'foryou' && (
          <motion.div key="foryou" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {forYouPlans.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">No plans to show yet</div>
            ) : (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1" data-hscroll="true">
                {forYouPlans.map((plan, i) => (
                  <motion.div key={plan.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <PlanCard plan={plan} allParticipants={allParticipants} onClick={() => onPlanClick(plan)} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'myspace' && (
          <motion.div key="myspace" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {/* My Communities */}
            {myCommunities.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between px-4 mb-2">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">My Communities</p>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(createPageUrl('Explore') + '?tab=communities')}
                    className="flex items-center gap-0.5 text-[#00c6d2] text-xs font-semibold">
                    See all <ChevronRight className="w-3 h-3" />
                  </motion.button>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1" data-hscroll="true">
                  {myCommunities.slice(0, 8).map((c, i) => (
                    <motion.button
                      key={c.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(createPageUrl('CommunityView') + `?id=${c.id}`)}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16"
                    >
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2"
                        style={{ borderColor: `${c.theme_color || tc}55` }}>
                        {c.cover_image
                          ? <img src={c.cover_image} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl"
                              style={{ background: `${c.theme_color || tc}22` }}>⭐</div>}
                      </div>
                      <p className="text-white text-[9px] font-bold text-center leading-tight line-clamp-2 w-full">{c.name}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* My Plans */}
            <div>
              <div className="flex items-center justify-between px-4 mb-2">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">My Plans</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(createPageUrl('MyPlans'))}
                  className="flex items-center gap-0.5 text-[#00c6d2] text-xs font-semibold">
                  See all <ChevronRight className="w-3 h-3" />
                </motion.button>
              </div>
              {myPlans.length === 0 ? (
                <div className="text-center py-6 px-4">
                  <p className="text-gray-600 text-sm">You haven't joined any plans yet</p>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1" data-hscroll="true">
                  {myPlans.map((plan, i) => (
                    <motion.div key={plan.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <PlanCard plan={plan} allParticipants={allParticipants} onClick={() => onPlanClick(plan)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
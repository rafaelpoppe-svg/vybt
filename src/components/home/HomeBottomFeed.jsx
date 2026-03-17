import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, MapPin, Calendar, Clock, ChevronRight, Flame, Sparkles, Building2 } from 'lucide-react';
import { format } from 'date-fns';

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

function PlanFeedCard({ plan, participantCount, communityName, onClick }) {
  const accent = accentOf(plan);
  const isHappening = isLiveNow(plan);
  const isCommunityPlan = !!plan.community_id;

  let dateLabel = '';
  try {
    dateLabel = plan.date ? format(new Date(plan.date), 'EEE, MMM d') : '';
  } catch (_) {}

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex-shrink-0 w-full snap-start rounded-2xl overflow-hidden text-left relative"
      style={{
        border: `1px solid ${accent}44`,
        background: 'rgba(255,255,255,0.04)',
        minHeight: 180,
      }}
    >
      {/* Cover image or gradient */}
      <div className="relative w-full h-44">
        {plan.cover_image ? (
          <img src={plan.cover_image} className="w-full h-full object-cover" alt="" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: `linear-gradient(135deg, #1a0a2e, ${accent}88)` }}
          >
            {isCommunityPlan ? '⭐' : '🎉'}
          </div>
        )}
        {/* Gradient overlay bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/30 to-transparent" />

        {/* Type badge — top left */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold"
          style={{
            background: isCommunityPlan ? 'rgba(84,43,155,0.75)' : 'rgba(0,0,0,0.6)',
            border: isCommunityPlan ? '1px solid #542b9b88' : '1px solid rgba(255,255,255,0.15)',
            color: isCommunityPlan ? '#e0c9ff' : '#ccc',
          }}
        >
          {isCommunityPlan ? (
            <><Building2 className="w-2.5 h-2.5" /> Community</>
          ) : (
            <>🎯 Individual</>
          )}
        </div>

        {/* Live / On Fire badge — top right */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {isHappening && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="flex items-center gap-1 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full"
            >
              ● LIVE
            </motion.div>
          )}
          {plan.is_highlighted && (
            <div className="flex items-center gap-1 bg-purple-500/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </div>
          )}
          {plan.is_on_fire && !plan.is_highlighted && (
            <div className="flex items-center gap-1 bg-red-500/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur">
              <Flame className="w-2.5 h-2.5" /> Hot
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 -mt-6 relative z-10">
        {/* Community name */}
        {communityName && (
          <p className="text-[10px] font-bold mb-1" style={{ color: accent }}>
            ⭐ {communityName}
          </p>
        )}

        {/* Title */}
        <h3 className="text-white font-bold text-lg leading-tight mb-2">{plan.title}</h3>

        {/* Meta info row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
          {plan.location_address && (
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: accent }} />
              <span className="truncate max-w-[160px]">{plan.location_address}</span>
            </div>
          )}
          {dateLabel && (
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: accent }} />
              <span>{dateLabel}</span>
            </div>
          )}
          {plan.time && (
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Clock className="w-3 h-3 flex-shrink-0" style={{ color: accent }} />
              <span>{plan.time}{plan.end_time ? ` — ${plan.end_time}` : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Users className="w-3 h-3 flex-shrink-0" style={{ color: accent }} />
            <span>{participantCount} going</span>
          </div>
        </div>

        {/* Tags */}
        {plan.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {plan.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${accent}22`, color: accent }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.button>
  );
}

function CommunityFeedCard({ community, memberCount, onClick }) {
  const accent = community.theme_color || '#00c6d2';

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex-shrink-0 w-full snap-start rounded-2xl overflow-hidden text-left relative"
      style={{
        border: `1px solid ${accent}44`,
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      {/* Cover */}
      <div className="relative w-full h-44">
        {community.cover_image ? (
          <img src={community.cover_image} className="w-full h-full object-cover" alt="" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: `linear-gradient(135deg, #1a0a2e, ${accent}88)` }}
          >
            ⭐
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/30 to-transparent" />

        {/* Community type badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold"
          style={{ background: 'rgba(84,43,155,0.75)', border: '1px solid #542b9b88', color: '#e0c9ff' }}
        >
          <Building2 className="w-2.5 h-2.5" /> Community
        </div>
      </div>

      {/* Content */}
      <div className="p-4 -mt-6 relative z-10">
        <h3 className="text-white font-bold text-lg leading-tight mb-1">{community.name}</h3>
        {community.description && (
          <p className="text-gray-400 text-xs mb-2 line-clamp-2">{community.description}</p>
        )}
        <div className="flex gap-4">
          {community.city && (
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <MapPin className="w-3 h-3" style={{ color: accent }} />
              <span>{community.city}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Users className="w-3 h-3" style={{ color: accent }} />
            <span>{memberCount} members</span>
          </div>
        </div>
        {community.party_types?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {community.party_types.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${accent}22`, color: accent }}
              >
                {tag}
              </span>
            ))}
          </div>
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

  // For You: highlighted first, then recommended, then hot/live
  const forYouItems = (() => {
    const active = plans.filter(p => !['ended', 'terminated', 'voting', 'renewed'].includes(p.status));
    const highlighted = active.filter(p => p.is_highlighted);
    const recIds = recommendedPlans.map(r => r.id);
    const recommended = active.filter(p => !p.is_highlighted && recIds.includes(p.id));
    const rest = active.filter(p => !p.is_highlighted && !recIds.includes(p.id))
      .filter(p => p.is_on_fire || (p.recent_joins >= 10) || isLiveNow(p));
    // Also add non-member communities for discovery
    const discoverCommunities = communities.filter(c => !memberCommunityIds.includes(c.id) && !c.is_deleted && !c.is_private);
    return [
      ...highlighted.map(p => ({ type: 'plan', data: p })),
      ...recommended.map(p => ({ type: 'plan', data: p })),
      ...rest.slice(0, 6).map(p => ({ type: 'plan', data: p })),
      ...discoverCommunities.slice(0, 3).map(c => ({ type: 'community', data: c })),
    ];
  })();

  // My Space: my plans + my communities
  const myPlanIds = myParticipations.map(p => p.plan_id);
  const myPlans = plans.filter(p => myPlanIds.includes(p.id) && !['terminated'].includes(p.status));
  const myCommunities = communities.filter(c => memberCommunityIds.includes(c.id) && !c.is_deleted);

  const mySpaceItems = [
    ...myCommunities.map(c => ({ type: 'community', data: c })),
    ...myPlans.map(p => ({ type: 'plan', data: p })),
  ];

  const TABS = [
    { id: 'foryou', label: 'For You', emoji: '✨' },
    { id: 'myspace', label: 'My Space', emoji: '🗓️' },
  ];

  const items = activeTab === 'foryou' ? forYouItems : mySpaceItems;

  const participantCounts = allParticipants.reduce((acc, p) => {
    acc[p.plan_id] = (acc[p.plan_id] || 0) + 1;
    return acc;
  }, {});

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
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {items.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm px-4">
              {activeTab === 'myspace' ? "You haven't joined any plans or communities yet" : 'Nothing to show yet'}
            </div>
          ) : (
            /* Horizontal snap-scroll feed */
            <div
              className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 snap-x snap-mandatory"
              data-hscroll="true"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {items.map((item, i) => (
                <div
                  key={`${item.type}-${item.data.id}`}
                  className="flex-shrink-0 snap-start"
                  style={{ width: 'calc(85vw)', maxWidth: 360 }}
                >
                  {item.type === 'plan' ? (
                    <PlanFeedCard
                      plan={item.data}
                      participantCount={participantCounts[item.data.id] || 0}
                      communityName={
                        item.data.community_id
                          ? communities.find(c => c.id === item.data.community_id)?.name
                          : null
                      }
                      onClick={() => onPlanClick(item.data)}
                    />
                  ) : (
                    <CommunityFeedCard
                      community={item.data}
                      memberCount={item.data.member_count || 0}
                      onClick={() => navigate(createPageUrl('CommunityView') + `?id=${item.data.id}`)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
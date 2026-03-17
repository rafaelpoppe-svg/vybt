import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, MapPin, Calendar, Clock, Flame, Sparkles, Building2, Ticket, UserCheck, CalendarDays } from 'lucide-react';
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

function InfoPill({ icon: Icon, label, accent }) {
  return (
    <div className="flex items-center gap-1 text-gray-300 text-xs">
      <Icon className="w-3 h-3 flex-shrink-0" style={{ color: accent }} />
      <span>{label}</span>
    </div>
  );
}

function PlanFeedCard({ plan, participantCount, communityName, communityColor, communityImage, onClick }) {
  const accent = accentOf(plan);
  const isHappening = isLiveNow(plan);
  const isCommunityPlan = !!plan.community_id;

  let dateLabel = '';
  try { dateLabel = plan.date ? format(new Date(plan.date), 'EEE, MMM d') : ''; } catch (_) {}

  const badgeLabel = isCommunityPlan ? communityName : 'Individual';

  const priceLabel = plan.price != null
    ? plan.price === 0 ? 'Free' : `€${plan.price}`
    : null;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden text-left relative"
      style={{ border: `1px solid ${accent}44`, background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Cover */}
      <div className="relative w-full" style={{ height: 200 }}>
        {plan.cover_image ? (
          <img src={plan.cover_image} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl"
            style={{ background: `linear-gradient(135deg, #1a0a2e, ${accent}88)` }}>
            {isCommunityPlan ? '⭐' : '🎉'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/20 to-transparent" />

        {/* Type badge — top left */}
         <div
           className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold"
           style={isCommunityPlan ? {
             background: `${communityColor || '#542b9b'}cc`,
             border: `1px solid ${communityColor || '#542b9b'}88`,
             color: '#fff',
           } : {
             background: 'rgba(0,0,0,0.65)',
             border: '1px solid rgba(255,255,255,0.15)',
             color: '#ccc',
           }}
         >
           {isCommunityPlan && badgeLabel ? (
             <>
               {communityImage ? (
                 <img src={communityImage} alt="" className="w-4 h-4 rounded object-cover" />
               ) : (
                 <Building2 className="w-2.5 h-2.5" />
               )}
               {badgeLabel}
             </>
           ) : (
             <>🎯 Individual</>
           )}
         </div>

        {/* Status badges — top right */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {isHappening && (
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}
              className="flex items-center gap-1 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              ● LIVE
            </motion.div>
          )}
          {plan.is_highlighted && (
            <div className="flex items-center gap-1 bg-purple-600/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </div>
          )}
          {plan.is_on_fire && !plan.is_highlighted && (
            <div className="flex items-center gap-1 bg-red-500/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur">
              <Flame className="w-2.5 h-2.5" /> Hot
            </div>
          )}
        </div>

        {/* Price pill — bottom right of image */}
        {priceLabel && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md text-xs font-bold"
            style={{ background: plan.price === 0 ? 'rgba(34,197,94,0.85)' : `${accent}cc`, color: '#fff' }}>
            <Ticket className="w-3 h-3" /> {priceLabel}
          </div>
        )}
      </div>

      {/* Content */}
       <div className="px-4 pt-3 pb-4">
         <h3 className="text-white font-bold text-xl leading-tight mb-3">{plan.title}</h3>

        {plan.description && (
          <p className="text-gray-400 text-xs mb-3 line-clamp-2">{plan.description}</p>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          {plan.location_address && (
            <InfoPill icon={MapPin} label={plan.location_address} accent={accent} />
          )}
          {dateLabel && <InfoPill icon={Calendar} label={dateLabel} accent={accent} />}
          {plan.time && (
            <InfoPill icon={Clock} label={`${plan.time}${plan.end_time ? ` — ${plan.end_time}` : ''}`} accent={accent} />
          )}
          <InfoPill icon={Users} label={`${participantCount} going`} accent={accent} />
          {plan.min_age != null && (
            <InfoPill icon={UserCheck} label={`${plan.min_age}+ years`} accent={accent} />
          )}
        </div>

        {plan.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {plan.tags.map((tag, i) => (
              <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${accent}22`, color: accent }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </motion.button>
  );
}

function CommunityFeedCard({ community, memberCount, friendsInCommunity, lastPlan, onClick }) {
  const accent = community.theme_color || '#00c6d2';

  let lastPlanLabel = '';
  try {
    if (lastPlan?.date) lastPlanLabel = format(new Date(lastPlan.date), 'EEE, MMM d');
  } catch (_) {}

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden text-left relative"
      style={{ border: `1px solid ${accent}44`, background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Cover */}
      <div className="relative w-full" style={{ height: 200 }}>
        {community.cover_image ? (
          <img src={community.cover_image} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl"
            style={{ background: `linear-gradient(135deg, #1a0a2e, ${accent}88)` }}>⭐</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/20 to-transparent" />

        {/* Community badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold"
          style={{ background: 'rgba(84,43,155,0.8)', border: '1px solid #542b9b88', color: '#e0c9ff' }}>
          <Building2 className="w-2.5 h-2.5" /> Community
        </div>

        {/* Member count pill */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md text-xs font-bold"
          style={{ background: `${accent}cc`, color: '#fff' }}>
          <Users className="w-3 h-3" /> {memberCount}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-4">
        <h3 className="text-white font-bold text-xl leading-tight mb-1">{community.name}</h3>
        {community.description && (
          <p className="text-gray-400 text-xs mb-3 line-clamp-2">{community.description}</p>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          {community.city && <InfoPill icon={MapPin} label={community.city} accent={accent} />}
          <InfoPill icon={Users} label={`${memberCount} members`} accent={accent} />
          {friendsInCommunity > 0 && (
            <InfoPill icon={UserCheck} label={`${friendsInCommunity} friend${friendsInCommunity > 1 ? 's' : ''} here`} accent={accent} />
          )}
          {lastPlan && (
            <InfoPill
              icon={CalendarDays}
              label={`Last: ${lastPlan.title?.slice(0, 16)}${lastPlan.title?.length > 16 ? '…' : ''} · ${lastPlanLabel}`}
              accent={accent}
            />
          )}
        </div>

        {community.party_types?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {community.party_types.map((tag, i) => (
              <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${accent}22`, color: accent }}>{tag}</span>
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
  friendIds = [],
  communityMembers = [],
  onPlanClick,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('foryou');

  const forYouItems = (() => {
    const active = plans.filter(p => !['ended', 'terminated', 'voting', 'renewed'].includes(p.status));
    const highlighted = active.filter(p => p.is_highlighted);
    const recIds = recommendedPlans.map(r => r.id);
    const recommended = active.filter(p => !p.is_highlighted && recIds.includes(p.id));
    const rest = active.filter(p => !p.is_highlighted && !recIds.includes(p.id))
      .filter(p => p.is_on_fire || isLiveNow(p));
    const discoverCommunities = communities.filter(c => !memberCommunityIds.includes(c.id) && !c.is_deleted && !c.is_private);
    return [
      ...highlighted.map(p => ({ type: 'plan', data: p })),
      ...recommended.map(p => ({ type: 'plan', data: p })),
      ...rest.slice(0, 6).map(p => ({ type: 'plan', data: p })),
      ...discoverCommunities.slice(0, 3).map(c => ({ type: 'community', data: c })),
    ];
  })();

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

  // Friends per community
  const friendsPerCommunity = communityMembers.reduce((acc, m) => {
    if (friendIds.includes(m.user_id)) {
      acc[m.community_id] = (acc[m.community_id] || 0) + 1;
    }
    return acc;
  }, {});

  // Last plan per community
  const lastPlanByCommunity = plans.reduce((acc, p) => {
    if (!p.community_id) return acc;
    if (!acc[p.community_id] || p.date > acc[p.community_id].date) {
      acc[p.community_id] = p;
    }
    return acc;
  }, {});

  return (
    <section className="mb-5 px-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 mb-4 w-fit">
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {items.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm">
              {activeTab === 'myspace' ? "You haven't joined any plans or communities yet" : 'Nothing to show yet'}
            </div>
          ) : (
            /* Vertical stacked feed — full width, one card per view */
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={`${item.type}-${item.data.id}`}>
                  {item.type === 'plan' ? (
                    <PlanFeedCard
                      plan={item.data}
                      participantCount={participantCounts[item.data.id] || 0}
                      communityName={
                        item.data.community_id
                          ? communities.find(c => c.id === item.data.community_id)?.name
                          : null
                      }
                      communityColor={
                        item.data.community_id
                          ? communities.find(c => c.id === item.data.community_id)?.theme_color
                          : null
                      }
                      communityImage={
                        item.data.community_id
                          ? communities.find(c => c.id === item.data.community_id)?.cover_image
                          : null
                      }
                      onClick={() => onPlanClick(item.data)}
                    />
                  ) : (
                    <CommunityFeedCard
                      community={item.data}
                      memberCount={item.data.member_count || 0}
                      friendsInCommunity={friendsPerCommunity[item.data.id] || 0}
                      lastPlan={lastPlanByCommunity[item.data.id] || null}
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
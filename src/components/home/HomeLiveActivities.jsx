import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

const ACTIVITY_CONFIG = {
  join:      { emoji: '🎉', color: '#00c6d2', label: 'entrou em' },
  story:     { emoji: '📸', color: '#a855f7', label: 'publicou uma story em' },
  created:   { emoji: '✨', color: '#f59e0b', label: 'criou o plano' },
  hot:       { emoji: '🔥', color: '#ef4444', label: 'plano a bombar perto de ti' },
  happening: { emoji: '⚡', color: '#f97316', label: 'a acontecer agora' },
  voting:    { emoji: '🗳️', color: '#3b82f6', label: 'votação a terminar' },
};

export default function HomeLiveActivities({ friendIds = [], allParticipants = [], stories = [], profilesMap = {}, plans = [], onPlanClick, onStoryClick }) {
  const activities = useMemo(() => {
    const result = [];
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // Friend joined a plan (last 24h)
    allParticipants.forEach(p => {
      if (!friendIds.includes(p.user_id)) return;
      if (!p.joined_at) return;
      if (now - new Date(p.joined_at).getTime() > DAY) return;
      const plan = plans.find(pl => pl.id === p.plan_id);
      if (!plan) return;
      result.push({
        id: `join-${p.id}`,
        type: 'join',
        profile: profilesMap[p.user_id],
        planName: plan.title,
        time: p.joined_at,
        plan,
        story: null,
      });
    });

    // Friend posted a story (last 24h)
    stories.forEach(s => {
      if (!friendIds.includes(s.user_id)) return;
      if (now - new Date(s.created_date).getTime() > DAY) return;
      const plan = plans.find(pl => pl.id === s.plan_id);
      result.push({
        id: `story-${s.id}`,
        type: 'story',
        profile: profilesMap[s.user_id],
        planName: plan?.title || '',
        time: s.created_date,
        plan: plan || null,
        story: s,
      });
    });

    // Friend created a plan (last 24h)
    plans.forEach(plan => {
      if (!friendIds.includes(plan.creator_id)) return;
      if (now - new Date(plan.created_date).getTime() > DAY) return;
      result.push({
        id: `created-${plan.id}`,
        type: 'created',
        profile: profilesMap[plan.creator_id],
        planName: plan.title,
        time: plan.created_date,
        plan,
        story: null,
      });
    });

    // Area activities — Hot plans
    plans.forEach(plan => {
      if (plan.is_on_fire || (plan.recent_joins >= 50)) {
        if (plan.status === 'upcoming' || plan.status === 'happening') {
          result.push({
            id: `hot-${plan.id}`,
            type: 'hot',
            profile: null,
            planName: plan.title,
            time: plan.updated_date || plan.created_date,
            plan,
            story: null,
          });
        }
      }
    });

    // Area activities — Happening now
    plans.forEach(plan => {
      if (plan.status === 'happening') {
        result.push({
          id: `happening-${plan.id}`,
          type: 'happening',
          profile: null,
          planName: plan.title,
          time: plan.updated_date || plan.created_date,
          plan,
          story: null,
        });
      }
    });

    // Area activities — Voting ending soon
    plans.forEach(plan => {
      if (plan.status === 'voting') {
        result.push({
          id: `voting-${plan.id}`,
          type: 'voting',
          profile: null,
          planName: plan.title,
          time: plan.voting_ends_at || plan.updated_date || plan.created_date,
          plan,
          story: null,
        });
      }
    });

    // Sort by time desc, deduplicate plan IDs for area events, limit to 10
    const seen = new Set();
    return result
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .filter(act => {
        if (['hot', 'happening', 'voting'].includes(act.type)) {
          const key = `${act.type}-${act.plan?.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
        }
        return true;
      })
      .slice(0, 10);
  }, [friendIds, allParticipants, stories, profilesMap, plans]);

  if (activities.length === 0) return null;

  const handleClick = (act) => {
    if (act.type === 'story' && act.story && onStoryClick) {
      onStoryClick(act.story);
    } else if (act.plan && onPlanClick) {
      onPlanClick(act.plan);
    }
  };

  return (
    <section className="px-4 mb-6">
      {/* Container */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Zap className="w-4 h-4 text-[#00c6d2]" fill="#00c6d2" />
          <h2 className="text-white font-bold text-sm tracking-wide">Live Activities</h2>
          <span className="ml-auto text-[10px] text-gray-500 font-medium">Últimas 24h</span>
        </div>

        {/* Activities */}
        <div className="divide-y divide-white/[0.04]">
          {activities.map((act, i) => {
            const cfg = ACTIVITY_CONFIG[act.type];
            const isAreaEvent = ['hot', 'happening', 'voting'].includes(act.type);
            const isClickable = act.plan || (act.story && onStoryClick);

            return (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => isClickable && handleClick(act)}
                className="flex items-center gap-3 px-4 py-3"
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              >
                {/* Avatar or emoji icon */}
                {isAreaEvent ? (
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-base"
                    style={{ background: `${cfg.color}18`, border: `1.5px solid ${cfg.color}44` }}
                  >
                    {cfg.emoji}
                  </div>
                ) : (
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center"
                      style={{ border: `1.5px solid ${cfg.color}66` }}
                    >
                      {act.profile?.photos?.[0] ? (
                        <img src={act.profile.photos[0]} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-xs text-white font-bold">{act.profile?.display_name?.[0] || '?'}</span>
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-[10px]">{cfg.emoji}</span>
                  </div>
                )}

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs leading-tight truncate">
                    {!isAreaEvent && (
                      <span className="font-bold">{act.profile?.display_name || 'Alguém'} </span>
                    )}
                    <span className="text-gray-400">{cfg.label} </span>
                    {act.planName && (
                      <span className="font-semibold" style={{ color: cfg.color }}>{act.planName}</span>
                    )}
                  </p>
                  <p className="text-gray-600 text-[10px] mt-0.5">
                    {formatDistanceToNow(new Date(act.time), { addSuffix: true, locale: pt })}
                  </p>
                </div>

                {/* Arrow if clickable */}
                {isClickable && (
                  <span className="text-gray-600 text-xs flex-shrink-0">›</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
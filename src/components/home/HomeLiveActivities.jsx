import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function HomeLiveActivities({ friendIds = [], allParticipants = [], stories = [], profilesMap = {}, plans = [], onPlanClick }) {
  const activities = useMemo(() => {
    const result = [];
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    // Friend joins (last 2h)
    allParticipants.forEach(p => {
      if (!friendIds.includes(p.user_id)) return;
      if (!p.joined_at) return;
      if (now - new Date(p.joined_at).getTime() > TWO_HOURS) return;
      const plan = plans.find(pl => pl.id === p.plan_id);
      if (!plan) return;
      result.push({
        id: `join-${p.id}`,
        type: 'join',
        profile: profilesMap[p.user_id],
        text: `joined ${plan.title}`,
        time: p.joined_at,
        plan,
      });
    });

    // Friend stories (last 2h)
    stories.forEach(s => {
      if (!friendIds.includes(s.user_id)) return;
      if (now - new Date(s.created_date).getTime() > TWO_HOURS) return;
      const plan = plans.find(pl => pl.id === s.plan_id);
      result.push({
        id: `story-${s.id}`,
        type: 'story',
        profile: profilesMap[s.user_id],
        text: `posted a story${plan ? ` in ${plan.title}` : ''}`,
        time: s.created_date,
        plan,
      });
    });

    return result.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
  }, [friendIds, allParticipants, stories, profilesMap, plans]);

  if (activities.length === 0) return null;

  return (
    <section className="px-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-[#00fea3]" fill="#00fea3" />
        <h2 className="text-white font-bold text-sm">Live Activities</h2>
      </div>

      <div className="space-y-2">
        {activities.map((act, i) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => act.plan && onPlanClick(act.plan)}
            className="flex items-center gap-3 p-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: act.plan ? 'pointer' : 'default' }}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center"
              style={{ border: '1.5px solid rgba(0,254,163,0.3)' }}
            >
              {act.profile?.photos?.[0] ? (
                <img src={act.profile.photos[0]} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-xs text-white font-bold">{act.profile?.display_name?.[0] || '?'}</span>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs leading-tight">
                <span className="font-bold">{act.profile?.display_name || 'Someone'}</span>
                {' '}<span className="text-gray-400">{act.text}</span>
              </p>
              <p className="text-gray-600 text-[10px] mt-0.5">
                {formatDistanceToNow(new Date(act.time), { addSuffix: true, locale: pt })}
              </p>
            </div>

            <span className="text-sm flex-shrink-0">{act.type === 'join' ? '🎉' : '📸'}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
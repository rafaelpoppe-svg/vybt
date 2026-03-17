import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function CommunityActivityFeed({ plans, members, profilesMap, tc }) {
  // Build a simple activity feed from recent plans and members
  const activities = [
    ...plans.slice(0, 5).map(p => ({
      type: 'plan',
      date: new Date(p.created_date),
      text: `New plan: "${p.title}"`,
      emoji: '🎉',
    })),
    ...members.slice(-5).map(m => {
      const profile = profilesMap[m.user_id];
      return {
        type: 'member',
        date: new Date(m.joined_at || m.created_date || Date.now()),
        text: `${profile?.display_name || 'Someone'} joined the community`,
        emoji: '👋',
      };
    }),
  ].sort((a, b) => b.date - a.date).slice(0, 6);

  if (activities.length === 0) return null;

  return (
    <div className="mx-4 mb-3">
      <p className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Recent Activity</p>
      <div className="rounded-2xl overflow-hidden border border-white/8 divide-y divide-white/5" style={{ background: '#111' }}>
        {activities.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 px-4 py-3"
          >
            <span className="text-lg shrink-0">{a.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-300 text-sm truncate">{a.text}</p>
            </div>
            <span className="text-gray-600 text-xs shrink-0">
              {formatDistanceToNow(a.date, { addSuffix: true })}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
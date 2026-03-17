import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarDays, Camera, UserPlus, BarChart2, Flame, Users, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommunityActivityFeed({ community, members, plans, stories, profilesMap, tc, isAdmin, currentUser }) {
  const navigate = useNavigate();

  // Build activity feed from real data
  const activities = useMemo(() => {
    const items = [];

    // New members joined
    members.forEach(m => {
      if (m.joined_at) {
        const profile = profilesMap[m.user_id];
        items.push({
          id: `member-${m.id}`,
          type: 'member_join',
          date: new Date(m.joined_at),
          profile,
          userId: m.user_id,
          isAdmin: m.role === 'admin',
        });
      }
    });

    // New plans created
    plans.forEach(p => {
      items.push({
        id: `plan-${p.id}`,
        type: 'plan_created',
        date: new Date(p.created_date),
        plan: p,
      });
    });

    // New stories posted
    stories.forEach(s => {
      const profile = profilesMap[s.user_id];
      items.push({
        id: `story-${s.id}`,
        type: 'story_posted',
        date: new Date(s.created_date),
        story: s,
        profile,
        userId: s.user_id,
      });
    });

    return items.sort((a, b) => b.date - a.date).slice(0, 30);
  }, [members, plans, stories, profilesMap]);

  // Admin stats
  const stats = useMemo(() => {
    const now = new Date();
    const last7d = new Date(now - 7 * 24 * 3600 * 1000);
    const last30d = new Date(now - 30 * 24 * 3600 * 1000);
    return {
      newMembersWeek: members.filter(m => m.joined_at && new Date(m.joined_at) > last7d).length,
      newMembersMonth: members.filter(m => m.joined_at && new Date(m.joined_at) > last30d).length,
      storiesWeek: stories.filter(s => new Date(s.created_date) > last7d).length,
      totalPlans: plans.length,
      upcomingPlans: plans.filter(p => p.date && new Date(p.date) >= new Date(now.toDateString())).length,
    };
  }, [members, plans, stories]);

  const activityIcon = (type) => {
    if (type === 'member_join') return <UserPlus className="w-3.5 h-3.5 text-green-400" />;
    if (type === 'plan_created') return <CalendarDays className="w-3.5 h-3.5 text-blue-400" />;
    if (type === 'story_posted') return <Camera className="w-3.5 h-3.5 text-purple-400" />;
  };

  const activityColor = (type) => {
    if (type === 'member_join') return 'bg-green-500/15 border-green-500/20';
    if (type === 'plan_created') return 'bg-blue-500/15 border-blue-500/20';
    if (type === 'story_posted') return 'bg-purple-500/15 border-purple-500/20';
  };

  const activityText = (item) => {
    if (item.type === 'member_join') {
      const name = item.profile?.display_name || 'Someone';
      return { main: name, sub: item.isAdmin ? 'joined as Admin' : 'joined the community' };
    }
    if (item.type === 'plan_created') {
      return { main: item.plan?.title || 'New plan', sub: 'plan created' };
    }
    if (item.type === 'story_posted') {
      const name = item.profile?.display_name || 'Someone';
      return { main: name, sub: 'posted a story' };
    }
  };

  return (
    <div className="pb-6">
      {/* Admin Dashboard */}
      {isAdmin && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4" style={{ color: tc }} />
            <span className="text-white font-bold text-sm">Community Stats</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: `${tc}30` }}>Admin</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="p-3 rounded-2xl border text-center" style={{ background: `${tc}10`, borderColor: `${tc}30` }}>
              <p className="text-xl font-black text-white">{stats.newMembersWeek}</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5">New Members<br />this week</p>
            </div>
            <div className="p-3 rounded-2xl border text-center" style={{ background: `${tc}10`, borderColor: `${tc}30` }}>
              <p className="text-xl font-black text-white">{stats.storiesWeek}</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Stories<br />this week</p>
            </div>
            <div className="p-3 rounded-2xl border text-center" style={{ background: `${tc}10`, borderColor: `${tc}30` }}>
              <p className="text-xl font-black text-white">{stats.upcomingPlans}</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Upcoming<br />Plans</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl border flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <Users className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-white font-bold text-sm">{members.length}</p>
                <p className="text-[10px] text-gray-500">Total Members</p>
              </div>
            </div>
            <div className="p-3 rounded-2xl border flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <Flame className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-white font-bold text-sm">{stats.newMembersMonth}</p>
                <p className="text-[10px] text-gray-500">Joined last 30d</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Feed Header */}
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4" style={{ color: tc }} />
        <span className="text-white font-bold text-sm">Live Activity</span>
        {activities.length > 0 && (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </div>

      {/* Feed */}
      {activities.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">⚡</div>
          <p className="text-gray-400 font-semibold">No activity yet</p>
          <p className="text-gray-600 text-sm mt-1">Activity will appear here as members join and participate</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((item, i) => {
            const text = activityText(item);
            if (!text) return null;

            const isClickable = item.type === 'member_join' || item.type === 'story_posted';
            const isPlanClickable = item.type === 'plan_created';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                onClick={() => {
                  if (isClickable && item.userId) navigate(createPageUrl('UserProfile') + `?id=${item.userId}`);
                  if (isPlanClickable && item.plan?.id) navigate(createPageUrl('PlanDetails') + `?id=${item.plan.id}`);
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl border ${activityColor(item.type)} ${isClickable || isPlanClickable ? 'cursor-pointer active:scale-98' : ''}`}
              >
                {/* Avatar or icon */}
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {(item.type === 'member_join' || item.type === 'story_posted') && item.profile?.photos?.[0]
                    ? <img src={item.profile.photos[0]} alt="" className="w-full h-full object-cover" />
                    : item.type === 'plan_created' && item.plan?.cover_image
                      ? <img src={item.plan.cover_image} alt="" className="w-full h-full object-cover" />
                      : <div className="flex items-center justify-center w-full h-full text-sm">
                          {item.type === 'member_join' ? '👤' : item.type === 'plan_created' ? '🎉' : '📸'}
                        </div>}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">{text.main}</p>
                  <p className="text-gray-500 text-[10px] truncate">{text.sub}</p>
                </div>

                {/* Icon + Time */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {activityIcon(item.type)}
                  </div>
                  <p className="text-[9px] text-gray-600">
                    {formatDistanceToNow(item.date, { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
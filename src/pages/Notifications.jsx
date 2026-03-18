import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Flame, Camera, Loader2, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import BottomNav from '../components/common/BottomNav';
import { useNotifications } from '../components/notifications/NotificationProvider';

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  try {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return `${Math.floor(diff / 604800)}w`;
  } catch { return ''; }
}

function groupByPeriod(notifications) {
  const now = Date.now();
  const groups = { live: [], today: [], week: [], month: [], older: [] };
  for (const n of notifications) {
    if (n.type === 'plan_happening_now') { groups.live.push(n); continue; }
    const h = (now - new Date(n.created_date)) / 3600000;
    if (h < 24) groups.today.push(n);
    else if (h < 168) groups.week.push(n);
    else if (h < 720) groups.month.push(n);
    else groups.older.push(n);
  }
  return groups;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ profile, size = 44, ringColor, badge }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full overflow-hidden w-full h-full"
        style={ringColor ? {
          padding: 2,
          background: ringColor,
        } : {}}
      >
        <div className="rounded-full overflow-hidden w-full h-full"
          style={ringColor ? { border: '2px solid #0b0b0b' } : {}}>
          {profile?.photos?.[0]
            ? <img src={profile.photos[0]} alt="" className="w-full h-full object-cover rounded-full" />
            : <div className="w-full h-full rounded-full bg-gradient-to-br from-[#542b9b] to-[#00c6d2] flex items-center justify-center text-white font-bold text-sm">
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </div>}
        </div>
      </div>
      {badge && (
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px]"
          style={{ background: '#0b0b0b', padding: 1 }}>
          <div className="w-full h-full rounded-full flex items-center justify-center"
            style={{ background: badge.bg }}>
            <span>{badge.emoji}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function Thumb({ src, size = 44 }) {
  if (!src) return null;
  return (
    <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: size, height: size }}>
      <img src={src} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label }) {
  return (
    <p className="text-white font-bold text-[15px] px-4 pt-5 pb-2">{label}</p>
  );
}

// ─── LIVE PLAN CARD ───────────────────────────────────────────────────────────

function LivePlanCard({ notification, plan, onMark }) {
  const navigate = useNavigate();
  const handleClick = () => {
    onMark(notification.id);
    navigate(createPageUrl('AddStory') + `?planId=${plan?.id || notification.plan_id}`);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      onClick={handleClick}
      className="mx-4 mb-2 rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, rgba(249,115,22,0.22) 0%, rgba(239,68,68,0.14) 100%)',
        border: '1.5px solid rgba(249,115,22,0.45)',
        boxShadow: '0 4px 24px rgba(249,115,22,0.18)',
      }}
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Plan thumbnail */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
          {plan?.cover_image
            ? <img src={plan.cover_image} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>}
          {/* live pulse overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-end justify-end p-1">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.0 }}
              className="w-2 h-2 rounded-full bg-orange-400"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">● Live</span>
          </div>
          <p className="text-white font-semibold text-[13px] leading-tight truncate">
            {plan?.title || notification.title}
          </p>
          <p className="text-orange-200/70 text-[11px] mt-0.5 truncate">{notification.message}</p>
        </div>

        <motion.div
          whileTap={{ scale: 0.9 }}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(249,115,22,0.25)', border: '1px solid rgba(249,115,22,0.4)' }}
        >
          <Camera className="w-3 h-3 text-orange-300" />
          <span className="text-orange-300 text-[11px] font-bold">Story</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── FRIEND REQUEST ROW ───────────────────────────────────────────────────────

function FriendRequestRow({ notification, requesterProfile, onMark }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localStatus, setLocalStatus] = useState(null);

  const accept = useMutation({
    mutationFn: async () => {
      const reqs = await base44.entities.Friendship.filter({ user_id: notification.related_user_id, status: 'pending' });
      if (reqs[0]) await base44.entities.Friendship.update(reqs[0].id, { status: 'accepted' });
      await base44.entities.Notification.update(notification.id, { is_read: true });
    },
    onSuccess: () => { setLocalStatus('accepted'); queryClient.invalidateQueries(['myFriendships']); onMark(notification.id); }
  });

  const decline = useMutation({
    mutationFn: async () => {
      const reqs = await base44.entities.Friendship.filter({ user_id: notification.related_user_id, status: 'pending' });
      if (reqs[0]) await base44.entities.Friendship.update(reqs[0].id, { status: 'declined' });
      await base44.entities.Notification.update(notification.id, { is_read: true });
    },
    onSuccess: () => { setLocalStatus('declined'); onMark(notification.id); }
  });

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 ${!notification.is_read ? 'bg-[#00c6d2]/5' : ''}`}>
      <div className="cursor-pointer" onClick={() => navigate(createPageUrl('UserProfile') + `?id=${notification.related_user_id}`)}>
        <Avatar
          profile={requesterProfile}
          size={44}
          ringColor="linear-gradient(135deg,#00c6d2,#542b9b)"
          badge={{ emoji: '👋', bg: '#00c6d2' }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-[13.5px] leading-snug">
          <span className="font-bold">{requesterProfile?.display_name || 'Someone'}</span>
          <span className="text-gray-300"> sent you a friend request.</span>
        </p>
        <p className="text-gray-500 text-[11px] mt-0.5">{timeAgo(notification.created_date)}</p>
      </div>

      {localStatus === 'accepted' ? (
        <span className="text-[11px] font-bold text-[#00c6d2] px-3 py-1 rounded-lg bg-[#00c6d2]/15">Friends ✓</span>
      ) : localStatus === 'declined' ? (
        <span className="text-[11px] text-gray-600">Removed</span>
      ) : (
        <div className="flex gap-2 flex-shrink-0">
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => accept.mutate()} disabled={accept.isPending || decline.isPending}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#00c6d2,#542b9b)' }}>
            {accept.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => decline.mutate()} disabled={accept.isPending || decline.isPending}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold text-white bg-gray-800">
            {decline.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
          </motion.button>
        </div>
      )}
    </div>
  );
}

// ─── GENERIC ROW ─────────────────────────────────────────────────────────────

const typeConfig = {
  friend_created_plan:   { emoji: '🎉', ring: 'linear-gradient(135deg,#00c6d2,#542b9b)', badge: '#00c6d2' },
  friend_posted_story:   { emoji: '📸', ring: 'linear-gradient(135deg,#a855f7,#ec4899)', badge: '#a855f7' },
  plan_recommendation:   { emoji: '📍', ring: 'linear-gradient(135deg,#f97316,#ef4444)', badge: '#f97316' },
  plan_highlighted:      { emoji: '✨', ring: 'linear-gradient(135deg,#00c6d2,#6366f1)', badge: '#00c6d2' },
  story_highlighted:     { emoji: '✨', ring: 'linear-gradient(135deg,#00c6d2,#6366f1)', badge: '#00c6d2' },
  voting_started:        { emoji: '🗳️', ring: 'linear-gradient(135deg,#f59e0b,#f97316)', badge: '#f59e0b' },
  plan_renewed:          { emoji: '🔄', ring: 'linear-gradient(135deg,#10b981,#059669)', badge: '#10b981' },
  plan_successful:       { emoji: '✅', ring: 'linear-gradient(135deg,#10b981,#059669)', badge: '#10b981' },
  plan_unsuccessful:     { emoji: '❌', ring: 'linear-gradient(135deg,#ef4444,#dc2626)', badge: '#ef4444' },
  plan_time_changed:     { emoji: '🕐', ring: 'linear-gradient(135deg,#f59e0b,#f97316)', badge: '#f59e0b' },
  plan_location_changed: { emoji: '📍', ring: 'linear-gradient(135deg,#f59e0b,#f97316)', badge: '#f59e0b' },
  new_story_in_plan:     { emoji: '📸', ring: 'linear-gradient(135deg,#a855f7,#ec4899)', badge: '#a855f7' },
};

function NotifRow({ notification, plan, relatedProfile, onMark }) {
  const navigate = useNavigate();
  const cfg = typeConfig[notification.type] || { emoji: '🔔', ring: 'linear-gradient(135deg,#6b7280,#374151)', badge: '#6b7280' };

  const handleClick = () => {
    onMark(notification.id);
    if (notification.plan_id) navigate(createPageUrl('PlanDetails') + `?id=${notification.plan_id}`);
    else if (notification.related_user_id) navigate(createPageUrl('UserProfile') + `?id=${notification.related_user_id}`);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${!notification.is_read ? 'bg-[#00c6d2]/5' : ''}`}
    >
      <Avatar
        profile={relatedProfile}
        size={44}
        ringColor={relatedProfile?.photos?.[0] ? cfg.ring : null}
        badge={{ emoji: cfg.emoji, bg: cfg.badge }}
      />

      <div className="flex-1 min-w-0">
        <p className={`text-[13.5px] leading-snug ${notification.is_read ? 'text-gray-300' : 'text-white'}`}>
          {relatedProfile && <span className="font-bold text-white">{relatedProfile.display_name} </span>}
          <span>{notification.message}</span>
        </p>
        <p className="text-gray-500 text-[11px] mt-0.5">{timeAgo(notification.created_date)}</p>
      </div>

      {/* Thumbnail */}
      {plan?.cover_image
        ? <Thumb src={plan.cover_image} size={44} />
        : !notification.is_read
          ? <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#00c6d2]" />
          : null}
    </motion.button>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { markAllAsRead } = useNotifications();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id,
    staleTime: 0,
  });

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.user_id === currentUser.id)
        queryClient.invalidateQueries(['notifications', currentUser.id]);
    });
    return () => unsub();
  }, [currentUser?.id]);

  const planIds = useMemo(() => [...new Set(notifications.filter(n => n.plan_id).map(n => n.plan_id))], [notifications]);
  const userIds = useMemo(() => [...new Set(notifications.filter(n => n.related_user_id).map(n => n.related_user_id))], [notifications]);

  const { data: plans = [] } = useQuery({
    queryKey: ['notif-plans', planIds.join(',')],
    queryFn: () => Promise.all(planIds.map(id => base44.entities.PartyPlan.filter({ id }).then(r => r[0]))),
    enabled: planIds.length > 0,
  });

  // Fetch user's participations to know which plans they're actually in
  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipationsNotif', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id,
  });
  const myPlanIds = useMemo(() => new Set(myParticipations.map(p => p.plan_id)), [myParticipations]);

  const { data: relatedProfiles = [] } = useQuery({
    queryKey: ['notif-profiles', userIds.join(',')],
    queryFn: () => Promise.all(userIds.map(uid => base44.entities.UserProfile.filter({ user_id: uid }).then(r => r[0]))),
    enabled: userIds.length > 0,
  });

  const plansMap = useMemo(() => { const m = {}; plans.forEach(p => p && (m[p.id] = p)); return m; }, [plans]);
  const profilesMap = useMemo(() => { const m = {}; relatedProfiles.forEach(p => p && (m[p.user_id] = p)); return m; }, [relatedProfiles]);

  const markOne = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onMutate: (id) => {
      queryClient.setQueryData(['notifications', currentUser?.id], (old = []) =>
        old.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  });

  const handleMark = (id) => {
    const n = notifications.find(x => x.id === id);
    if (n && !n.is_read) markOne.mutate(id);
  };

  const HIDDEN = ['new_group_message', 'new_direct_message'];

  const filtered = useMemo(() =>
    notifications.filter(n => !HIDDEN.includes(n.type))
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    [notifications]
  );

  const groups = useMemo(() => groupByPeriod(filtered), [filtered]);
  const unreadCount = filtered.filter(n => !n.is_read).length;

  const renderNotif = (n) => {
    if (n.type === 'plan_happening_now')
      return <LivePlanCard key={n.id} notification={n} plan={plansMap[n.plan_id]} onMark={handleMark} />;
    if (n.type === 'friend_request')
      return <FriendRequestRow key={n.id} notification={n} requesterProfile={profilesMap[n.related_user_id]} onMark={handleMark} />;
    return <NotifRow key={n.id} notification={n} plan={plansMap[n.plan_id]} relatedProfile={profilesMap[n.related_user_id]} onMark={handleMark} />;
  };

  return (
    <div className="flex flex-col bg-[#0b0b0b]" style={{ height: '100dvh' }}>

      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-[#0b0b0b] px-4 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-black text-white tracking-tight">Notifications</h1>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={markAllAsRead}
                className="text-[13px] text-[#00c6d2] font-semibold">
                Mark all read
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => navigate(createPageUrl('NotificationSettings'))}
              className="p-2 rounded-full bg-gray-900">
              <Settings className="w-4 h-4 text-gray-400" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-[#00c6d2] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-2">
            <div className="text-5xl">🔔</div>
            <p className="text-gray-400 font-semibold">No activity yet</p>
            <p className="text-gray-600 text-sm">Interactions from friends will appear here</p>
          </div>
        ) : (
          <div className="pb-8">

            {/* LIVE — top priority */}
            {groups.live.length > 0 && (
              <div>
                <SectionLabel label="🔥 Happening Now" />
                <div className="space-y-2 mb-2">{groups.live.map(renderNotif)}</div>
              </div>
            )}

            {groups.today.length > 0 && (
              <div>
                <SectionLabel label="Today" />
                <div className="divide-y divide-gray-800/50">{groups.today.map(renderNotif)}</div>
              </div>
            )}

            {groups.week.length > 0 && (
              <div>
                <SectionLabel label="This Week" />
                <div className="divide-y divide-gray-800/50">{groups.week.map(renderNotif)}</div>
              </div>
            )}

            {groups.month.length > 0 && (
              <div>
                <SectionLabel label="This Month" />
                <div className="divide-y divide-gray-800/50">{groups.month.map(renderNotif)}</div>
              </div>
            )}

            {groups.older.length > 0 && (
              <div>
                <SectionLabel label="Older" />
                <div className="divide-y divide-gray-800/50">{groups.older.map(renderNotif)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0"><BottomNav /></div>
    </div>
  );
}
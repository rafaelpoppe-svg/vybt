import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Flame, Camera, Heart, Calendar, UserPlus,
  Sparkles, CheckCircle, AlertCircle, Loader2, Check, X, MapPin, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BottomNav from '../components/common/BottomNav';
import { useNotifications } from '../components/notifications/NotificationProvider';

// ─── helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
  } catch {
    return '';
  }
}

function groupByPeriod(notifications) {
  const now = new Date();
  const groups = { live: [], today: [], week: [], month: [], older: [] };

  for (const n of notifications) {
    if (n.type === 'plan_happening_now') {
      groups.live.push(n);
      continue;
    }
    const diff = (now - new Date(n.created_date)) / 1000 / 60 / 60;
    if (diff < 24) groups.today.push(n);
    else if (diff < 24 * 7) groups.week.push(n);
    else if (diff < 24 * 30) groups.month.push(n);
    else groups.older.push(n);
  }
  return groups;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function AvatarStack({ profiles = [], size = 10 }) {
  const shown = profiles.slice(0, 3);
  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => (
        <div key={i} className={`w-${size} h-${size} rounded-full border-2 border-[#0b0b0b] overflow-hidden flex-shrink-0`}
          style={{ zIndex: shown.length - i }}>
          {p?.photos?.[0]
            ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00c6d2] flex items-center justify-center text-white text-xs font-bold">
                {p?.display_name?.[0] || '?'}
              </div>}
        </div>
      ))}
    </div>
  );
}

// ── LIVE PLAN CARD (highlighted orange) ──────────────────────────────────────
function LivePlanCard({ notification, plan, onMark }) {
  const navigate = useNavigate();
  const handleClick = () => {
    onMark(notification.id);
    navigate(createPageUrl('AddStory') + `?planId=${plan?.id || notification.plan_id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="rounded-2xl overflow-hidden cursor-pointer relative"
      style={{
        background: 'linear-gradient(135deg, rgba(249,115,22,0.18), rgba(239,68,68,0.12))',
        border: '1.5px solid rgba(249,115,22,0.5)',
        boxShadow: '0 0 20px rgba(249,115,22,0.15)'
      }}
    >
      {/* Pulsing live dot */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="w-2.5 h-2.5 rounded-full bg-orange-500"
        />
        <span className="text-orange-400 text-[11px] font-bold uppercase tracking-wide">Live</span>
      </div>

      <div className="flex gap-3 p-4">
        {/* Plan cover / icon */}
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative">
          {plan?.cover_image
            ? <img src={plan.cover_image} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Flame className="w-7 h-7 text-white" />
              </div>}
        </div>

        <div className="flex-1 min-w-0 pr-12">
          <p className="text-orange-300 font-bold text-[11px] uppercase tracking-wider mb-0.5">🔥 Happening Now</p>
          <p className="text-white font-semibold text-sm leading-tight truncate">{plan?.title || notification.title}</p>
          <p className="text-gray-400 text-xs mt-1 line-clamp-1">{notification.message}</p>
        </div>
      </div>

      {/* CTA bar */}
      <div className="flex items-center justify-center gap-2 py-2.5 border-t border-orange-500/20"
        style={{ background: 'rgba(249,115,22,0.08)' }}>
        <Camera className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-orange-400 text-xs font-bold">Post your story now</span>
      </div>
    </motion.div>
  );
}

// ── FRIEND REQUEST CARD ──────────────────────────────────────────────────────
function FriendRequestCard({ notification, requesterProfile, onMark }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localStatus, setLocalStatus] = useState(null); // null | 'accepted' | 'declined'

  const accept = useMutation({
    mutationFn: async () => {
      const requests = await base44.entities.Friendship.filter({
        user_id: notification.related_user_id, status: 'pending'
      });
      const req = requests[0];
      if (req) await base44.entities.Friendship.update(req.id, { status: 'accepted' });
      await base44.entities.Notification.update(notification.id, { is_read: true });
    },
    onSuccess: () => {
      setLocalStatus('accepted');
      queryClient.invalidateQueries(['myFriendships']);
      onMark(notification.id);
    }
  });

  const decline = useMutation({
    mutationFn: async () => {
      const requests = await base44.entities.Friendship.filter({
        user_id: notification.related_user_id, status: 'pending'
      });
      const req = requests[0];
      if (req) await base44.entities.Friendship.update(req.id, { status: 'declined' });
      await base44.entities.Notification.update(notification.id, { is_read: true });
    },
    onSuccess: () => {
      setLocalStatus('declined');
      onMark(notification.id);
    }
  });

  const handleProfile = () => {
    if (notification.related_user_id)
      navigate(createPageUrl('UserProfile') + `?id=${notification.related_user_id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
        notification.is_read ? 'bg-gray-900/40 border-gray-800/60' : 'bg-gray-900 border-[#00c6d2]/20'
      }`}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer" onClick={handleProfile}>
        {requesterProfile?.photos?.[0]
          ? <img src={requesterProfile.photos[0]} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00c6d2] flex items-center justify-center text-white font-bold">
              {requesterProfile?.display_name?.[0] || '?'}
            </div>}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm leading-tight">
          <span className="font-bold">{requesterProfile?.display_name || 'Someone'}</span>
          <span className="text-gray-400"> sent you a friend request</span>
        </p>
        <p className="text-gray-500 text-[11px] mt-0.5">{timeAgo(notification.created_date)}</p>
      </div>

      {/* Actions */}
      {localStatus === 'accepted' ? (
        <span className="text-[#00c6d2] text-xs font-bold px-3 py-1.5 rounded-full bg-[#00c6d2]/15 border border-[#00c6d2]/30">Following</span>
      ) : localStatus === 'declined' ? (
        <span className="text-gray-500 text-xs">Declined</span>
      ) : (
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => accept.mutate()}
            disabled={accept.isPending || decline.isPending}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #00c6d2, #542b9b)' }}
          >
            {accept.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => decline.mutate()}
            disabled={accept.isPending || decline.isPending}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-gray-300 bg-gray-800 border border-gray-700"
          >
            {decline.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

// ── GENERIC NOTIFICATION ROW ─────────────────────────────────────────────────
const typeConfig = {
  friend_created_plan: { emoji: '🎉', accent: '#00c6d2' },
  friend_posted_story: { emoji: '📸', accent: '#a855f7' },
  plan_recommendation: { emoji: '📍', accent: '#f97316' },
  plan_highlighted:    { emoji: '✨', accent: '#00c6d2' },
  story_highlighted:   { emoji: '✨', accent: '#00c6d2' },
  voting_started:      { emoji: '🗳️', accent: '#f59e0b' },
  plan_renewed:        { emoji: '🔄', accent: '#10b981' },
  plan_successful:     { emoji: '✅', accent: '#10b981' },
  plan_unsuccessful:   { emoji: '❌', accent: '#ef4444' },
  plan_time_changed:   { emoji: '🕐', accent: '#f59e0b' },
  plan_location_changed: { emoji: '📍', accent: '#f59e0b' },
  new_story_in_plan:   { emoji: '📸', accent: '#a855f7' },
};

function NotifRow({ notification, plan, relatedProfile, onMark }) {
  const navigate = useNavigate();
  const cfg = typeConfig[notification.type] || { emoji: '🔔', accent: '#00c6d2' };

  const handleClick = () => {
    onMark(notification.id);
    if (notification.plan_id) {
      navigate(createPageUrl('PlanDetails') + `?id=${notification.plan_id}`);
    } else if (notification.related_user_id) {
      navigate(createPageUrl('UserProfile') + `?id=${notification.related_user_id}`);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${
        notification.is_read ? 'bg-gray-900/40 border-gray-800/60' : 'bg-gray-900 border-gray-800'
      }`}
    >
      {/* Avatar/emoji */}
      <div className="relative flex-shrink-0">
        {relatedProfile?.photos?.[0]
          ? <img src={relatedProfile.photos[0]} alt="" className="w-12 h-12 rounded-full object-cover" />
          : <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
              style={{ background: `${cfg.accent}22`, border: `1px solid ${cfg.accent}44` }}>
              {cfg.emoji}
            </div>}
        {/* type dot */}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
          style={{ background: cfg.accent }}>
          {cfg.emoji}
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${notification.is_read ? 'text-gray-400' : 'text-white'}`}>
          {relatedProfile && <span className="font-bold text-white">{relatedProfile.display_name} </span>}
          {notification.message}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">{timeAgo(notification.created_date)}</p>
      </div>

      {/* Plan thumbnail or story preview */}
      {plan?.cover_image && (
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative"
          style={{ border: `2px solid ${cfg.accent}55` }}>
          <img src={plan.cover_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Unread dot */}
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.accent }} />
      )}
    </motion.button>
  );
}

// ── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest px-1 pt-2 pb-1">{label}</p>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { markAllAsRead } = useNotifications();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id,
    staleTime: 0,
  });

  // Real-time
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.user_id === currentUser.id) {
        queryClient.invalidateQueries(['notifications', currentUser.id]);
      }
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Collect related plan IDs and user IDs
  const planIds = [...new Set(notifications.filter(n => n.plan_id).map(n => n.plan_id))];
  const userIds = [...new Set(notifications.filter(n => n.related_user_id).map(n => n.related_user_id))];

  const { data: plans = [] } = useQuery({
    queryKey: ['notif-plans', planIds.join(',')],
    queryFn: () => Promise.all(planIds.map(id => base44.entities.PartyPlan.filter({ id }).then(r => r[0]))),
    enabled: planIds.length > 0,
  });

  const { data: relatedProfiles = [] } = useQuery({
    queryKey: ['notif-profiles', userIds.join(',')],
    queryFn: () => Promise.all(userIds.map(uid => base44.entities.UserProfile.filter({ user_id: uid }).then(r => r[0]))),
    enabled: userIds.length > 0,
  });

  const plansMap = useMemo(() => {
    const m = {};
    plans.forEach(p => p && (m[p.id] = p));
    return m;
  }, [plans]);

  const profilesMap = useMemo(() => {
    const m = {};
    relatedProfiles.forEach(p => p && (m[p.user_id] = p));
    return m;
  }, [relatedProfiles]);

  // Mark one as read (local optimistic + server)
  const markOne = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onMutate: (id) => {
      queryClient.setQueryData(['notifications', currentUser?.id], (old = []) =>
        old.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  });

  const handleMark = (id) => {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.is_read) markOne.mutate(id);
  };

  // Filter out message notifications as requested
  const HIDDEN_TYPES = ['new_group_message', 'new_direct_message'];

  const filtered = useMemo(() =>
    notifications
      .filter(n => !HIDDEN_TYPES.includes(n.type))
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    [notifications]
  );

  const groups = useMemo(() => groupByPeriod(filtered), [filtered]);

  const unreadCount = filtered.filter(n => !n.is_read).length;

  const renderNotif = (n) => {
    if (n.type === 'plan_happening_now') {
      return <LivePlanCard key={n.id} notification={n} plan={plansMap[n.plan_id]} onMark={handleMark} />;
    }
    if (n.type === 'friend_request') {
      return (
        <FriendRequestCard
          key={n.id}
          notification={n}
          requesterProfile={profilesMap[n.related_user_id]}
          onMark={handleMark}
        />
      );
    }
    return (
      <NotifRow
        key={n.id}
        notification={n}
        plan={plansMap[n.plan_id]}
        relatedProfile={profilesMap[n.related_user_id]}
        onMark={handleMark}
      />
    );
  };

  return (
    <div className="flex flex-col bg-[#0b0b0b]" style={{ height: '100dvh' }}>
      {/* Header */}
      <header className="flex-shrink-0 sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800/60 px-4 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Activity</h1>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={markAllAsRead}
                className="text-xs text-[#00c6d2] font-semibold"
              >
                Mark all read
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(createPageUrl('NotificationSettings'))}
              className="p-2 rounded-full bg-gray-900 border border-gray-800"
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-5xl">🔔</div>
            <p className="text-gray-500 font-medium">No activity yet</p>
            <p className="text-gray-600 text-sm">When friends interact with you, it'll show up here</p>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-2 pb-6">
            {/* LIVE — always first, highlighted */}
            {groups.live.length > 0 && (
              <div className="space-y-2">
                <SectionHeader label="🔥 Happening Now" />
                {groups.live.map(renderNotif)}
              </div>
            )}

            {groups.today.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <SectionHeader label="Today" />
                {groups.today.map(renderNotif)}
              </div>
            )}

            {groups.week.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <SectionHeader label="This Week" />
                {groups.week.map(renderNotif)}
              </div>
            )}

            {groups.month.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <SectionHeader label="This Month" />
                {groups.month.map(renderNotif)}
              </div>
            )}

            {groups.older.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <SectionHeader label="Older" />
                {groups.older.map(renderNotif)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        <BottomNav />
      </div>
    </div>
  );
}
import React, { useState, useEffect, useMemo, useRef} from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Flame, Camera, Loader2, ChevronLeft } from 'lucide-react';
import { useNotifications } from '../components/notifications/NotificationProvider';
import { useLanguage } from '../components/common/LanguageContext';

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr, t) {
  try {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return t.timeAgoNow;
    if (diff < 3600) return t.timeAgoMins.replace('{n}', Math.floor(diff / 60));
    if (diff < 86400) return t.timeAgoHours.replace('{n}', Math.floor(diff / 3600));
    if (diff < 604800) return t.timeAgoDays.replace('{n}', Math.floor(diff / 86400));
    return t.timeAgoDays.replace('{n}', Math.floor(diff / 604800) + 'w');
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
        style={ringColor ? { padding: 2, background: ringColor } : {}}
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
          style={{ background: 'var(--bg)', padding: 1 }}>
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

function LivePlanCard({ notification, plan, onMark, t }) {
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
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
          {plan?.cover_image
            ? <img src={plan.cover_image} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>}
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
            <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">● {t.liveNow}</span>
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
          <span className="text-orange-300 text-[11px] font-bold">{t.yourStory}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── UPCOMING PLAN ROW ────────────────────────────────────────────────────────

function UpcomingPlanRow({ notification, plan, onMark, t }) {
  const navigate = useNavigate();
  const handleClick = () => {
    onMark(notification.id);
    navigate(createPageUrl('PlanDetails') + `?id=${plan?.id || notification.plan_id}`);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${!notification.is_read ? 'bg-[#00c6d2]/5' : ''}`}
    >
      <div className="relative flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden"
        style={{ border: '1.5px solid rgba(0,198,210,0.35)' }}>
        {plan?.cover_image
          ? <img src={plan.cover_image} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-[#00c6d2]/40 to-[#542b9b]/40 flex items-center justify-center text-lg">📍</div>}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{background: 'var(--bg)', padding: 1}}>
          <div className="w-full h-full rounded-full bg-[#00c6d2] flex items-center justify-center text-[9px]">📅</div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-[13.5px] leading-snug">
          <span className="font-bold">{plan?.title || notification.title} </span>
          <span className="text-gray-300">{t.notifHappeningNearYou}</span>
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {plan?.date && (
            <span className="text-[#00c6d2] text-[11px] font-semibold">{plan.date}</span>
          )}
          {plan?.date && <span className="text-gray-600 text-[10px]">·</span>}
          <span className="text-gray-500 text-[11px]">{timeAgo(notification.created_date, t)}</span>
        </div>
      </div>

      {!notification.is_read && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#00c6d2]" />}
    </motion.button>
  );
}

// ─── FRIEND REQUEST ROW ───────────────────────────────────────────────────────

function FriendRequestRow({ notification, requesterProfile, onMark }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [localStatus, setLocalStatus] = useState(null);

  // Fetch the real friendship status to handle page re-enters correctly
  // We check both directions to ensure we find the friendship regardless of who initiated it
  const { data: existingFriendship, isLoading: isLoadingFriendship } = useQuery({
    queryKey: ['friendship', notification.user_id, notification.related_user_id],
    queryFn: async () => {
      console.log('[DEBUG] Buscando amizade (Direção A):', { user: notification.user_id, friend: notification.related_user_id });
      const resA = await base44.entities.Friendship.filter({ user_id: notification.user_id, friend_id: notification.related_user_id });
      
      if (resA && resA.length > 0) {
        console.log('[DEBUG] Resultado A:', resA);
        return resA;
      }

      console.log('[DEBUG] Buscando amizade (Direção B):', { user: notification.related_user_id, friend: notification.user_id });
      const resB = await base44.entities.Friendship.filter({ user_id: notification.related_user_id, friend_id: notification.user_id });
      console.log('[DEBUG] Resultado B:', resB);
      return resB;
    },
    select: (data) => data?.find(f => f.status === 'accepted') || data?.[0] || null,
    staleTime: 0, // Set to 0 to ensure fresh data on re-entry
  });

  // Derive the display status: 
  // 1. localStatus (optimistic update)
  // 2. existingFriendship (real-time DB status)
  // 3. notification.is_read (fallback: if read but no friendship found, it was removed)
  const derivedStatus = localStatus || (
    existingFriendship?.status === 'accepted' ? 'accepted' :
    existingFriendship?.status === 'declined' ? 'declined' :
    (notification.is_read ? 'removed' : null)
  );

  console.log('[DEBUG] FriendRequestRow Render:', {
    notificationId: notification.id,
    isRead: notification.is_read,
    localStatus,
    existingFriendshipStatus: existingFriendship?.status,
    derivedStatus,
    isLoadingFriendship
  });

  const accept = useMutation({
    onMutate: () => {
      console.log('[DEBUG] onMutate: Definindo localStatus como accepted');
      setLocalStatus('accepted');
    },
    mutationFn: async () => {
      console.log('[DEBUG] Iniciando Accept Mutation');
      
      // 1. Find all related friendship records
      const [reqsA, reqsB] = await Promise.all([
        base44.entities.Friendship.filter({ user_id: notification.related_user_id, friend_id: notification.user_id }),
        base44.entities.Friendship.filter({ user_id: notification.user_id, friend_id: notification.related_user_id })
      ]);
      
      const allReqs = [...(reqsA || []), ...(reqsB || [])];
      console.log('[DEBUG] Todos os registros encontrados:', allReqs);
      
      // 2. Update all to accepted
      const updates = allReqs.map(item => {
        if (item.status !== 'accepted') {
          console.log('[DEBUG] Atualizando para accepted:', item.id);
          return base44.entities.Friendship.update(item.id, { status: 'accepted' });
        }
        return null;
      }).filter(Boolean);
      
      await Promise.all(updates);

      // 3. Ensure both directions exist
      if (!allReqs.some(r => r.user_id === notification.user_id && r.friend_id === notification.related_user_id)) {
        console.log('[DEBUG] Criando direção A->B');
        await base44.entities.Friendship.create({ user_id: notification.user_id, friend_id: notification.related_user_id, status: 'accepted' });
      }
      if (!allReqs.some(r => r.user_id === notification.related_user_id && r.friend_id === notification.user_id)) {
        console.log('[DEBUG] Criando direção B->A');
        await base44.entities.Friendship.create({ user_id: notification.related_user_id, friend_id: notification.user_id, status: 'accepted' });
      }

      // 4. Notification and trigger
      await base44.entities.Notification.update(notification.id, { is_read: true });
      try {
        const { createNotification } = await import('../components/notifications/NotificationTriggers');
        const bobProfile = await base44.entities.UserProfile.filter({ user_id: notification.user_id }).then(r => r[0]);
        await createNotification(notification.related_user_id, 'friend_request', 
          `${bobProfile?.display_name || 'Alguém'} aceitou seu pedido de amizade!`, 
          { related_user_id: notification.user_id }
        );
      } catch (e) { console.error('Erro ao disparar notificação:', e); }
    },
    onSuccess: () => {
      console.log('[DEBUG] Mutation Success');
      queryClient.invalidateQueries({ queryKey: ['friendship', notification.user_id, notification.related_user_id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', notification.user_id] });
      onMark(notification.id);
    },
    onError: (err) => {
      console.error('[DEBUG] Mutation Error:', err);
      setLocalStatus(null);
    }
  });

  const decline = useMutation({
    mutationFn: async () => {
      console.log('[DEBUG] Iniciando Decline Mutation');
      const reqsA = await base44.entities.Friendship.filter({ user_id: notification.related_user_id, friend_id: notification.user_id });
      const reqsB = await base44.entities.Friendship.filter({ user_id: notification.user_id, friend_id: notification.related_user_id });
      const allReqs = [...(reqsA || []), ...(reqsB || [])];
      
      for (const item of allReqs) {
        if (item.status === 'pending') {
          console.log('[DEBUG] Declinando registro:', item.id);
          await base44.entities.Friendship.update(item.id, { status: 'declined' });
        }
      }
      await base44.entities.Notification.update(notification.id, { is_read: true });
    },
    onSuccess: () => { 
      setLocalStatus('declined'); 
      queryClient.invalidateQueries(['friendship', notification.user_id, notification.related_user_id]);
      onMark(notification.id); 
    }
  });

  const addFriend = useMutation({
    onMutate: () => setLocalStatus('pending'),
    mutationFn: async () => {
      const myProfile = await base44.entities.UserProfile.filter({ user_id: notification.user_id }).then(r => r[0]);
      await base44.entities.Friendship.create({
        user_id: notification.user_id,
        friend_id: notification.related_user_id,
        status: 'pending',
      });
      const { notifyFriendRequest } = await import('../components/notifications/NotificationTriggers');
      await notifyFriendRequest(notification.related_user_id, notification.user_id, myProfile?.display_name || 'Alguém');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friendship', notification.user_id, notification.related_user_id]);
    }
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
          <span className="font-bold">{requesterProfile?.display_name || t.someone}</span>
          <span className="text-gray-300">{t.friendRequest}</span>
        </p>
        <p className="text-gray-500 text-[11px] mt-0.5">{timeAgo(notification.created_date, t)}</p>
      </div>

      {derivedStatus === 'accepted' ? (
        <span className="text-[11px] font-bold text-[#00c6d2] px-3 py-1 rounded-lg bg-[#00c6d2]/15">{t.friends} ✓</span>
      ) : derivedStatus === 'declined' ? (
        <span className="text-[11px] text-gray-600">{t.removed}</span>
      ) : derivedStatus === 'removed' ? (
        <motion.button whileTap={{ scale: 0.92 }}
          onClick={() => addFriend.mutate()} disabled={addFriend.isPending}
          className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold text-white bg-[#00c6d2]">
          {addFriend.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Adicionar"}
        </motion.button>
      ) : derivedStatus === 'pending' ? (
        <span className="text-[11px] text-gray-500 italic">Pendente...</span>
      ) : (
        <div className="flex gap-2 flex-shrink-0">
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => accept.mutate()} disabled={accept.isPending || decline.isPending}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#00c6d2,#542b9b)' }}>
            {accept.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : t.confirm}
          </motion.button>
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => decline.mutate()} disabled={accept.isPending || decline.isPending}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold text-white bg-gray-800">
            {decline.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : t.delete}
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
  story_reaction:        { emoji: '❤️', ring: 'linear-gradient(135deg,#ec4899,#f97316)', badge: '#ec4899' },
};

function NotifRow({ notification, plan, relatedProfile, onMark, t }) {
  const navigate = useNavigate();
  const cfg = typeConfig[notification.type] || { emoji: '🔔', ring: 'linear-gradient(135deg,#6b7280,#374151)', badge: '#6b7280' };

  const handleClick = () => {
    onMark(notification.id);
    if (notification.type === 'story_reaction' && notification.plan_id) {
      navigate(createPageUrl('StoryView') + `?id=${notification.plan_id}`);
    } else if (notification.plan_id) {
      navigate(createPageUrl('PlanDetails') + `?id=${notification.plan_id}`);
    } else if (notification.related_user_id) {
      navigate(createPageUrl('UserProfile') + `?id=${notification.related_user_id}`);
    }
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
        <p className="text-gray-500 text-[11px] mt-0.5">{timeAgo(notification.created_date, t)}</p>
      </div>

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
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const hasMarkedRead = useRef(false);

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
      if ((event.type === 'create' || event.type === 'update') && event.data?.user_id === currentUser.id)
        queryClient.invalidateQueries(['notifications', currentUser.id]);
    });
    return () => unsub();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || notifications.length === 0 || hasMarkedRead.current) return;
    hasMarkedRead.current = true;

    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    Promise.all(
      unreadIds.map(id => base44.entities.Notification.update(id, { is_read: true }))
    ).then(() => {
      queryClient.invalidateQueries(['notifications', currentUser?.id]);
      markAllAsRead();
    });
  }, [currentUser?.id, notifications]);

  const planIds = useMemo(() => [...new Set(notifications.filter(n => n.plan_id).map(n => n.plan_id))], [notifications]);
  const userIds = useMemo(() => [...new Set(notifications.filter(n => n.related_user_id).map(n => n.related_user_id))], [notifications]);

  const { data: plans = [] } = useQuery({
    queryKey: ['notif-plans', planIds.join(',')],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 200),
    enabled: planIds.length > 0,
    staleTime: 60000,
  });

  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipationsNotif', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id,
  });
  const myPlanIds = useMemo(() => new Set(myParticipations.map(p => p.plan_id)), [myParticipations]);

  const { data: relatedProfiles = [] } = useQuery({
    queryKey: ['notif-profiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 200),
    enabled: userIds.length > 0,
    staleTime: 60000,
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

  const isPlanTrulyLive = (plan) => {
    if (!plan) return false;
    if (['ended', 'terminated', 'voting'].includes(plan.status)) return false;
    if (plan.date && plan.end_time) {
      const end = new Date(`${plan.date}T${plan.end_time}:00`);
      if (new Date() > end) return false;
    }
    if (plan.date && plan.time) {
      const start = new Date(`${plan.date}T${plan.time}:00`);
      const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
      if (new Date() > end) return false;
    }
    return true;
  };

  const filtered = useMemo(() => {
    const seenPlanNotifType = new Set();
    return notifications
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .filter(n => {
        if (HIDDEN.includes(n.type)) return false;
        if (n.plan_id) {
          const key = `${n.plan_id}::${n.type}`;
          if (seenPlanNotifType.has(key)) return false;
          seenPlanNotifType.add(key);
        }
        if (n.type === 'plan_happening_now') {
          if (!n.plan_id || !myPlanIds.has(n.plan_id)) return false;
          if (!isPlanTrulyLive(plansMap[n.plan_id])) return false;
        }
        return true;
      });
  }, [notifications, myPlanIds, plansMap]);

  const groups = useMemo(() => groupByPeriod(filtered), [filtered]);
  const unreadCount = filtered.filter(n => !n.is_read).length;

  const renderNotif = (n) => {
    if (n.type === 'plan_happening_now')
      return <LivePlanCard key={n.id} notification={n} plan={plansMap[n.plan_id]} onMark={handleMark} t={t} />;
    if (n.type === 'plan_recommendation')
      return <UpcomingPlanRow key={n.id} notification={n} plan={plansMap[n.plan_id]} onMark={handleMark} t={t} />;
    if (n.type === 'friend_request')
      return <FriendRequestRow key={n.id} notification={n} requesterProfile={profilesMap[n.related_user_id]} onMark={handleMark} />;
    return <NotifRow key={n.id} notification={n} plan={plansMap[n.plan_id]} relatedProfile={profilesMap[n.related_user_id]} onMark={handleMark} t={t} />;
  };

  return (
    <div
      className="overflow-hidden flex flex-col"
      style={{ background: 'var(--bg)', position: 'fixed', inset: 0 }}
    >
      {/* ── Header ── */}
      <header className="flex-shrink-0 px-4 pb-2"
        style={{ background: 'var(--bg)', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(createPageUrl('Home'))}
              className="p-2 rounded-full bg-gray-900">
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>
            <h1 className="text-[22px] font-black text-white tracking-tight">{t.notifications}</h1>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={markAllAsRead}
                className="text-[13px] text-[#00c6d2] font-semibold">
                {t.markAllRead}
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
            <p className="text-gray-400 font-semibold">{t.notifNoActivity}</p>
            <p className="text-gray-600 text-sm">{t.notifNoActivityDesc}</p>
          </div>
        ) : (
          <div className="pb-8">
            {groups.live.length > 0 && (
              <div>
                <SectionLabel label={t.notifSectionLive} />
                <div className="space-y-2 mb-2">{groups.live.map(renderNotif)}</div>
              </div>
            )}
            {groups.today.length > 0 && (
              <div>
                <SectionLabel label={t.notifSectionToday} />
                <div className="divide-y divide-gray-800/50">{groups.today.map(renderNotif)}</div>
              </div>
            )}
            {groups.week.length > 0 && (
              <div>
                <SectionLabel label={t.notifSectionWeek} />
                <div className="divide-y divide-gray-800/50">{groups.week.map(renderNotif)}</div>
              </div>
            )}
            {groups.month.length > 0 && (
              <div>
                <SectionLabel label={t.notifSectionMonth} />
                <div className="divide-y divide-gray-800/50">{groups.month.map(renderNotif)}</div>
              </div>
            )}
            {groups.older.length > 0 && (
              <div>
                <SectionLabel label={t.notifSectionOlder} />
                <div className="divide-y divide-gray-800/50">{groups.older.map(renderNotif)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
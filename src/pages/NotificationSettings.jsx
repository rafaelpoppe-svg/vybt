import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2, Bell, BellOff, Check } from 'lucide-react';
import { toast } from 'sonner';

const SECTIONS = [
  {
    title: 'Messages',
    items: [
      { key: 'group_message', emoji: '💬', label: 'Group & Direct messages', desc: 'Notifications for new chat messages' },
    ]
  },
  {
    title: 'Social',
    items: [
      { key: 'friend_request', emoji: '👋', label: 'Friend requests', desc: 'When someone sends you a friend request' },
      { key: 'friend_story', emoji: '📸', label: 'Friends\' stories', desc: 'When a friend posts a new story' },
      { key: 'friend_created_plan', emoji: '🎉', label: 'Friend created a plan', desc: 'When a friend creates a new plan' },
    ]
  },
  {
    title: 'Plans',
    items: [
      { key: 'plan_happening_now', emoji: '🔥', label: 'Happening Now', desc: 'When a plan you\'re in is live — post stories!' },
      { key: 'plan_recommendation', emoji: '📍', label: 'Plan recommendations', desc: 'Plans nearby that match your vibe' },
      { key: 'plan_update', emoji: '🕐', label: 'Plan updates', desc: 'Time or location changes in your plans' },
      { key: 'voting', emoji: '🗳️', label: 'Voting & results', desc: 'Voting started or plan result' },
    ]
  },
  {
    title: 'Reminders',
    items: [
      { key: 'plan_reminder_1day', emoji: '⏰', label: '1 day before', desc: 'Reminder the day before the plan' },
      { key: 'plan_reminder_1hour', emoji: '⏱️', label: '1 hour before', desc: 'Reminder 1 hour before the plan starts' },
    ]
  },
];

const defaultPrefs = {
  new_plan_push: true,
  friend_story_push: true,
  friend_story_email: false,
  plan_update_push: true,
  friend_request_push: true,
  plan_recommendation_push: true,
  voting_push: true,
  plan_happening_now_push: true,
  friend_created_plan_push: true,
  group_message_push: true,
  plan_reminder_1day: false,
  plan_reminder_1hour: true,
  mute_all: false,
};

function Toggle({ enabled, onToggle, disabled }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-[#00c6d2]' : 'bg-gray-700'} ${disabled ? 'opacity-40' : ''}`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
      />
    </motion.button>
  );
}

// Map our simplified keys to actual prefs keys
function prefKey(key) {
  const map = {
    group_message: 'group_message_push',
    friend_request: 'friend_request_push',
    friend_story: 'friend_story_push',
    friend_created_plan: 'friend_created_plan_push',
    plan_happening_now: 'plan_happening_now_push',
    plan_recommendation: 'plan_recommendation_push',
    plan_update: 'plan_update_push',
    voting: 'voting_push',
    plan_reminder_1day: 'plan_reminder_1day',
    plan_reminder_1hour: 'plan_reminder_1hour',
  };
  return map[key] || `${key}_push`;
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [prefs, setPrefs] = useState(defaultPrefs);
  // Track whether user has made local changes — if so, don't overwrite from remote
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => navigate('/'));
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile', currentUser?.id],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: currentUser.id }),
    select: (d) => d[0],
    enabled: !!currentUser?.id,
  });

  // Only sync from remote on first load, never after that
  useEffect(() => {
    if (profile?.notification_prefs && !initialized) {
      setPrefs({ ...defaultPrefs, ...profile.notification_prefs });
      setInitialized(true);
    }
  }, [profile, initialized]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.UserProfile.update(profile.id, { notification_prefs: prefs }),
    onSuccess: () => {
      toast.success('Preferences saved');
    }
  });

  const toggle = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  const muteAll = prefs.mute_all;

  return (
    <div 
      className="min-h-screen"
      style={{ background: 'var(--bg)' }}
    >
      <header
        className="sticky top-0 z-40 backdrop-blur-lg border-b border-gray-800 flex items-center justify-between px-4 py-4"
        style={{ background: 'var(--bg)', opacity: 0.95, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-900">
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-xl font-bold text-white">Notification Settings</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !profile}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00c6d2] text-[#0b0b0b] font-bold text-sm disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save</>}
        </motion.button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center pt-20">
          <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-6 pb-16 space-y-5">

          {/* Mute ALL toggle — big prominent card */}
          <motion.div
            whileTap={{ scale: 0.99 }}
            className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{
              background: muteAll
                ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(185,28,28,0.1))'
                : 'linear-gradient(135deg, rgba(0,198,210,0.1), rgba(84,43,155,0.1))',
              border: muteAll ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(0,198,210,0.2)'
            }}
          >
            <div className="flex items-center gap-3">
              {muteAll
                ? <BellOff className="w-5 h-5 text-red-400" />
                : <Bell className="w-5 h-5 text-[#00c6d2]" />}
              <div>
                <p className="text-white font-bold text-sm">Mute all notifications</p>
                <p className="text-gray-400 text-xs mt-0.5">You won't receive any notifications</p>
              </div>
            </div>
            <Toggle enabled={muteAll} onToggle={() => toggle('mute_all')} />
          </motion.div>

          {/* Individual sections */}
          {SECTIONS.map(section => (
            <div key={section.title}>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 px-1">{section.title}</p>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800 overflow-hidden">
                {section.items.map((item) => {
                  const pk = prefKey(item.key);
                  return (
                    <div key={item.key} className="flex items-center gap-3 px-4 py-3.5">
                      <span className="text-xl w-8 text-center flex-shrink-0">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">{item.label}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle
                        enabled={!muteAll && !!prefs[pk]}
                        onToggle={() => toggle(pk)}
                        disabled={muteAll}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div 
            className="flex items-start gap-3 p-3 rounded-xl border border-gray-800"
            style={{ background: 'var(--bg)', opacity: 0.5 }}
          >
            <Bell className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">
              Push notifications require device permission. Each notification appears only once — even when you're active in the app. Disable any category above to stop receiving that type.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
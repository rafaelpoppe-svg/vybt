import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, Loader2, Bell, BellOff, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../components/common/LanguageContext';

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
  const { t } = useLanguage();

  const SECTIONS = [
    {
      title: t.notifSectionMessages,
      items: [
        { key: 'group_message', emoji: '💬', label: t.notifGroupMessages, desc: t.notifGroupMessagesDesc },
      ]
    },
    {
      title: t.notifSectionSocial,
      items: [
        { key: 'friend_request', emoji: '👋', label: t.notifFriendRequest, desc: t.notifFriendRequestDesc },
        { key: 'friend_story', emoji: '📸', label: t.notifFriendStory, desc: t.notifFriendStoryDesc },
        { key: 'friend_created_plan', emoji: '🎉', label: t.notifFriendCreatedPlan, desc: t.notifFriendCreatedPlanDesc },
      ]
    },
    {
      title: t.plans,
      items: [
        { key: 'plan_happening_now', emoji: '🔥', label: t.happeningNow, desc: t.notifPlanHappeningDesc },
        { key: 'plan_recommendation', emoji: '📍', label: t.notifPlanRecommendation, desc: t.notifPlanRecommendationDesc },
        { key: 'plan_update', emoji: '🕐', label: t.notifPlanUpdate, desc: t.notifPlanUpdateDesc },
        { key: 'voting', emoji: '🗳️', label: t.notifVoting, desc: t.notifVotingDesc },
      ]
    },
    {
      title: t.notifSectionReminders,
      items: [
        { key: 'plan_reminder_1day', emoji: '⏰', label: t.notifReminder1Day, desc: t.notifReminder1DayDesc },
        { key: 'plan_reminder_1hour', emoji: '⏱️', label: t.notifReminder1Hour, desc: t.notifReminder1HourDesc },
      ]
    },
  ];

  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [prefs, setPrefs] = useState(defaultPrefs);
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

  useEffect(() => {
    if (profile?.notification_prefs && !initialized) {
      setPrefs({ ...defaultPrefs, ...profile.notification_prefs });
      setInitialized(true);
    }
  }, [profile, initialized]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.UserProfile.update(profile.id, { notification_prefs: prefs }),
    onSuccess: () => {
      toast.success(t.notifPrefsSaved);
    }
  });

  const toggle = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  const muteAll = prefs.mute_all;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-40 backdrop-blur-lg border-b border-gray-800 flex items-center justify-between px-4 py-4"
        style={{ background: 'var(--bg)', opacity: 0.95, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-900">
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-xl font-bold text-white">{t.notifSettingsTitle}</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !profile}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00c6d2] text-[#0b0b0b] font-bold text-sm disabled:opacity-50"
        >
          {saveMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><Check className="w-4 h-4" /> {t.save}</>}
        </motion.button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center pt-20">
          <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-6 pb-16 space-y-5">

          {/* Mute ALL */}
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
                <p className="text-white font-bold text-sm">{t.notifMuteAll}</p>
                <p className="text-gray-400 text-xs mt-0.5">{t.notifMuteAllDesc}</p>
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
            <p className="text-xs text-gray-500">{t.notifPermissionNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
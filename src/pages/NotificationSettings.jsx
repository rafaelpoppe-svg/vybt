import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2, Bell, Smartphone, Mail, Check } from 'lucide-react';
import { toast } from 'sonner';

const notificationTypes = [
  {
    key: 'new_plan',
    label: 'New plans nearby',
    desc: 'When a new plan is created in your city',
    emoji: '🎉'
  },
  {
    key: 'friend_story',
    label: 'Friend stories',
    desc: 'When a friend posts a new story',
    emoji: '📸'
  },
  {
    key: 'plan_update',
    label: 'Plan updates',
    desc: 'Changes to plans you joined (time, location)',
    emoji: '📍'
  },
  {
    key: 'friend_request',
    label: 'Friend requests',
    desc: 'New friend requests and acceptances',
    emoji: '👋'
  },
  {
    key: 'group_message',
    label: 'Group messages',
    desc: 'New messages in your plan groups',
    emoji: '💬'
  },
  {
    key: 'voting',
    label: 'Voting & results',
    desc: 'When voting starts or plan results are out',
    emoji: '🗳️'
  }
];

const defaultPrefs = {
  new_plan_push: true,    new_plan_email: false,
  friend_story_push: true, friend_story_email: false,
  plan_update_push: true,  plan_update_email: false,
  friend_request_push: true, friend_request_email: false,
  group_message_push: true,  group_message_email: false,
  voting_push: true,       voting_email: false,
  plan_reminder_1day: false,
  plan_reminder_1hour: true
};

function Toggle({ enabled, onToggle }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-[#00fea3]' : 'bg-gray-700'}`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
      />
    </motion.button>
  );
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [prefs, setPrefs] = useState(defaultPrefs);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => navigate('/'));
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile', currentUser?.id],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: currentUser.id }),
    select: (d) => d[0],
    enabled: !!currentUser?.id,
    onSuccess: (p) => {
      if (p?.notification_prefs) {
        setPrefs({ ...defaultPrefs, ...p.notification_prefs });
      }
    }
  });

  useEffect(() => {
    if (profile?.notification_prefs) {
      setPrefs({ ...defaultPrefs, ...profile.notification_prefs });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.UserProfile.update(profile.id, { notification_prefs: prefs }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myProfile', currentUser?.id]);
      toast.success('Preferences saved');
    }
  });

  const toggle = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 flex items-center justify-between px-4 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-900"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00fea3] text-[#0b0b0b] font-bold text-sm"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save
            </>
          )}
        </motion.button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center pt-20">
          <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-6 pb-16 space-y-4">
          {/* Channel legend */}
          <div className="flex items-center gap-6 px-1 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Smartphone className="w-3.5 h-3.5 text-[#00fea3]" />
              Push
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              Email
            </div>
          </div>

          {notificationTypes.map((type) => (
            <div
              key={type.key}
              className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">{type.emoji}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{type.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{type.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 pl-9">
                {/* Push */}
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-[#00fea3]" />
                  <Toggle
                    enabled={prefs[`${type.key}_push`]}
                    onToggle={() => toggle(`${type.key}_push`)}
                  />
                </div>
                {/* Email */}
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <Toggle
                    enabled={prefs[`${type.key}_email`]}
                    onToggle={() => toggle(`${type.key}_email`)}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Plan Reminders */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">⏰</span>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Plan reminders</p>
                <p className="text-gray-500 text-xs mt-0.5">Get reminded before plans you joined start</p>
              </div>
            </div>
            <div className="pl-9 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">1 day before</p>
                  <p className="text-xs text-gray-500">Reminder the day before the plan</p>
                </div>
                <Toggle enabled={prefs.plan_reminder_1day} onToggle={() => toggle('plan_reminder_1day')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">1 hour before</p>
                  <p className="text-xs text-gray-500">Reminder 1 hour before the plan starts</p>
                </div>
                <Toggle enabled={prefs.plan_reminder_1hour} onToggle={() => toggle('plan_reminder_1hour')} />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-900/50 border border-gray-800 mt-2">
            <Bell className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">
              Push notifications require permission from your device. Email notifications are sent to your registered address.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
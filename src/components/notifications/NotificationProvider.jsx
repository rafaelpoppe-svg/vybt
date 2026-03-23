import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageCircle, Users, Camera, Flame, Calendar, Heart, UserPlus } from 'lucide-react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

const notificationIcons = {
  new_group_message: MessageCircle,
  new_direct_message: MessageCircle,
  new_group_member: Users,
  voting_started: Flame,
  plan_happening_now: Flame,
  new_story_in_plan: Camera,
  friend_request: UserPlus,
  plan_time_changed: Calendar,
  plan_location_changed: Calendar,
  plan_recommendation: Heart,
};

// Map notification type → prefs key
const notifTypeToPrefKey = {
  new_group_message:    'group_message_push',
  new_direct_message:   'group_message_push',
  new_group_member:     'plan_update_push',
  voting_started:       'voting_push',
  plan_happening_now:   'plan_happening_now_push',
  plan_highlighted:     'plan_update_push',
  story_highlighted:    'friend_story_push',
  new_story_in_plan:    'friend_story_push',
  friend_posted_story:  'friend_story_push',
  friend_request:       'friend_request_push',
  plan_time_changed:    'plan_update_push',
  plan_location_changed:'plan_update_push',
  plan_recommendation:  'plan_recommendation_push',
  friend_created_plan:  'friend_created_plan_push',
  plan_renewed:         'plan_update_push',
  plan_unsuccessful:    'voting_push',
  plan_successful:      'voting_push',
  story_reaction:       'friend_story_push',
};

const defaultPrefs = {
  new_plan_push: true,
  friend_story_push: true,
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

export function NotificationProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadDMCount, setUnreadDMCount] = useState(0);
  const [userPrefs, setUserPrefs] = useState(defaultPrefs);
  const queryClient = useQueryClient();
  // Track already-shown notification IDs to avoid duplicates
  const shownIds = useRef(new Set());

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        const [notifications, profiles, dmMessages] = await Promise.all([
          base44.entities.Notification.filter({ user_id: user.id, is_read: false }),
          base44.entities.UserProfile.filter({ user_id: user.id }),
          base44.entities.ChatMessage.filter({ receiver_id: user.id, message_type: 'direct', is_read: false }),
        ]);
        setUnreadCount(notifications.length);
        setUnreadDMCount(dmMessages.length);
        if (profiles[0]?.notification_prefs) {
          setUserPrefs({ ...defaultPrefs, ...profiles[0].notification_prefs });
        }
      } catch (e) {}
    };
    getUser();
  }, []);

  // Re-fetch prefs whenever profile is updated
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = base44.entities.UserProfile.subscribe((event) => {
      if (event.data?.user_id === currentUser.id && event.data?.notification_prefs) {
        setUserPrefs({ ...defaultPrefs, ...event.data.notification_prefs });
      }
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Real-time notification subscription
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      const notification = event.data;
      if (!notification || notification.user_id !== currentUser.id) return;

      // Handle updates (mark as read) — decrement counter
      if (event.type === 'update') {
        if (notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
          queryClient.invalidateQueries(['notifications', currentUser.id]);
        }
        return;
      }

      if (event.type !== 'create') return;

      // Deduplicate — never show the same notification twice
      if (shownIds.current.has(notification.id)) return;
      shownIds.current.add(notification.id);

      // Update unread count
      setUnreadCount(prev => prev + 1);
      queryClient.invalidateQueries(['notifications', currentUser.id]);

      // Check user preferences before showing toast
      const prefs = userPrefs;
      if (prefs.mute_all) return;

      const prefKey = notifTypeToPrefKey[notification.type];
      if (prefKey && prefs[prefKey] === false) return;

      // Show toast
      const Icon = notificationIcons[notification.type] || MessageCircle;
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gray-900 border border-[#00c6d2]/30 rounded-2xl p-4 shadow-2xl shadow-[#00c6d2]/10 max-w-sm cursor-pointer"
          onClick={() => {
            toast.dismiss(t);
            handleNotificationClick(notification);
          }}
        >
          <div className="flex gap-3 items-start">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="w-10 h-10 rounded-full bg-[#00c6d2]/20 flex items-center justify-center flex-shrink-0"
            >
              <Icon className="w-5 h-5 text-[#00c6d2]" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">
                {notification.title || notification.message}
              </p>
              {notification.title && (
                <p className="text-gray-400 text-xs mt-1">{notification.message}</p>
              )}
            </div>
          </div>
        </motion.div>
      ), {
        duration: 4000,
        position: 'top-center',
      });
    });

    return () => unsubscribe();
  }, [currentUser?.id, queryClient, userPrefs]);

  // Real-time DM unread count
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      const msg = event.data;
      if (!msg || msg.message_type !== 'direct') return;
      if (event.type === 'create' && msg.receiver_id === currentUser.id && !msg.is_read) {
        setUnreadDMCount(prev => prev + 1);
      }
      if (event.type === 'update' && msg.receiver_id === currentUser.id && msg.is_read) {
        setUnreadDMCount(prev => Math.max(0, prev - 1));
      }
      if (event.type === 'delete' && msg.receiver_id === currentUser.id && !msg.is_read) {
        setUnreadDMCount(prev => Math.max(0, prev - 1));
      }
    });
    return () => unsub();
  }, [currentUser?.id]);

  const handleNotificationClick = async (notification) => {
    await base44.entities.Notification.update(notification.id, { is_read: true });
    setUnreadCount(prev => Math.max(0, prev - 1));
    queryClient.invalidateQueries(['notifications', currentUser.id]);

    if (notification.plan_id) {
      if (['new_group_message', 'voting_started'].includes(notification.type)) {
        window.location.href = `/Chat?planId=${notification.plan_id}`;
      } else {
        window.location.href = `/PlanDetails?id=${notification.plan_id}`;
      }
    } else if (notification.related_user_id) {
      if (notification.type === 'friend_request') {
        window.location.href = '/Friends';
      } else if (notification.type === 'new_direct_message') {
        window.location.href = `/Chat?userId=${notification.related_user_id}`;
      } else {
        window.location.href = `/UserProfile?id=${notification.related_user_id}`;
      }
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser?.id) return;
    const notifications = await base44.entities.Notification.filter({
      user_id: currentUser.id,
      is_read: false
    });
    for (const n of notifications) {
      await base44.entities.Notification.update(n.id, { is_read: true });
    }
    setUnreadCount(0);
    queryClient.invalidateQueries(['notifications', currentUser.id]);
  };

  const refreshUnreadCount = async () => {
    if (!currentUser?.id) return;
    const notifications = await base44.entities.Notification.filter({ user_id: currentUser.id, is_read: false });
    setUnreadCount(notifications.length);
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, unreadDMCount, markAllAsRead, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}
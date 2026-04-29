import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
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

    // Debounce the re-fetch to avoid rate limit when many events arrive at once
    let debounceTimer = null;
    const debouncedRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          const unread = await base44.entities.Notification.filter({
            user_id: currentUser.id,
            is_read: false,
          });
          setUnreadCount(unread.length);
          queryClient.invalidateQueries(['notifications', currentUser.id]);
        } catch (e) {}
      }, 2000); // wait 2s after last event before fetching
    };

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      const notification = event.data;
      if (!notification || notification.user_id !== currentUser.id) return;

      if (event.type === 'create' || event.type === 'update') {
        debouncedRefetch();
      }

      if (event.type !== 'create') return;
      if (shownIds.current.has(notification.id)) return;
      shownIds.current.add(notification.id);
    });

    return () => {
      unsubscribe();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [currentUser?.id, queryClient, userPrefs]);

  // Real-time DM unread count
  useEffect(() => {
    if (!currentUser?.id) return;
    const hasReceiver = (msg) => Array.isArray(msg.receiver_id)
      ? msg.receiver_id.includes(currentUser.id)
      : msg.receiver_id === currentUser.id;

    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      const msg = event.data;
      if (!msg || msg.message_type !== 'direct') return;
      if (event.type === 'create' && hasReceiver(msg) && !msg.is_read) {
        setUnreadDMCount(prev => prev + 1);
      }
      if (event.type === 'update' && hasReceiver(msg) && msg.is_read) {
        setUnreadDMCount(prev => Math.max(0, prev - 1));
      }
      if (event.type === 'delete' && hasReceiver(msg) && !msg.is_read) {
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
    await Promise.all(notifications.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setUnreadCount(0);
    queryClient.invalidateQueries(['notifications', currentUser.id]);
  };

  const resetDMCountForFriend = async (friendId) => {
    if (!currentUser?.id) return;
    // Re-fetch real count from DB and update
    try {
      const msgs = await base44.entities.ChatMessage.filter({ message_type: 'direct', is_read: false });
      const count = msgs.filter(m => {
        const rx = Array.isArray(m.receiver_id) ? m.receiver_id : [m.receiver_id];
        return rx.includes(currentUser.id);
      }).length;
      setUnreadDMCount(count);
    } catch {}
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, unreadDMCount, markAllAsRead, resetDMCountForFriend }}>
      {children}
    </NotificationContext.Provider>
  );
}
import React, { createContext, useContext, useEffect, useState } from 'react';
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

export function NotificationProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Get initial unread count
        const notifications = await base44.entities.Notification.filter({ 
          user_id: user.id, 
          is_read: false 
        });
        setUnreadCount(notifications.length);
      } catch (e) {}
    };
    getUser();
  }, []);

  // Real-time notification subscription
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data.user_id === currentUser.id) {
        const notification = event.data;
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
        
        // Invalidate queries
        queryClient.invalidateQueries(['notifications', currentUser.id]);
        
        // Show toast notification
        const Icon = notificationIcons[notification.type] || MessageCircle;
        toast.custom((t) => (
          <div 
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-2xl max-w-sm cursor-pointer"
            onClick={() => {
              toast.dismiss(t);
              handleNotificationClick(notification);
            }}
          >
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-[#00fea3]/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#00fea3]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">
                  {notification.title || notification.message}
                </p>
                {notification.title && (
                  <p className="text-gray-400 text-xs mt-1">{notification.message}</p>
                )}
              </div>
            </div>
          </div>
        ), {
          duration: 5000,
          position: 'top-center',
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser?.id, queryClient]);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    await base44.entities.Notification.update(notification.id, { is_read: true });
    setUnreadCount(prev => Math.max(0, prev - 1));
    queryClient.invalidateQueries(['notifications', currentUser.id]);

    // Navigate based on type
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
    
    for (const notification of notifications) {
      await base44.entities.Notification.update(notification.id, { is_read: true });
    }
    
    setUnreadCount(0);
    queryClient.invalidateQueries(['notifications', currentUser.id]);
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
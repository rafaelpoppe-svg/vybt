import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, MessageCircle, Users, Camera, Flame, 
  Sparkles, Heart, Calendar, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import BottomNav from '../components/common/BottomNav';

const notificationIcons = {
  new_group_message: MessageCircle,
  new_group_member: Users,
  new_direct_message: MessageCircle,
  voting_started: AlertCircle,
  plan_happening_now: Flame,
  new_story_in_plan: Camera,
  plan_highlighted: Sparkles,
  story_highlighted: Sparkles,
  friend_posted_story: Camera,
  plan_recommendation: Heart,
  plan_renewed: Calendar,
  plan_unsuccessful: AlertCircle,
  plan_successful: CheckCircle,
  friend_created_plan: Calendar
};

const notificationColors = {
  new_group_message: 'bg-blue-500/20 text-blue-400',
  new_group_member: 'bg-green-500/20 text-green-400',
  new_direct_message: 'bg-purple-500/20 text-purple-400',
  voting_started: 'bg-orange-500/20 text-orange-400',
  plan_happening_now: 'bg-red-500/20 text-red-400',
  new_story_in_plan: 'bg-[#542b9b]/20 text-[#542b9b]',
  plan_highlighted: 'bg-[#00fea3]/20 text-[#00fea3]',
  story_highlighted: 'bg-[#00fea3]/20 text-[#00fea3]',
  friend_posted_story: 'bg-pink-500/20 text-pink-400',
  plan_recommendation: 'bg-rose-500/20 text-rose-400',
  plan_renewed: 'bg-cyan-500/20 text-cyan-400',
  plan_unsuccessful: 'bg-red-500/20 text-red-400',
  plan_successful: 'bg-green-500/20 text-green-400',
  friend_created_plan: 'bg-indigo-500/20 text-indigo-400'
};

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {}
    };
    getUser();
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', currentUser?.id]);
    }
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    if (notification.plan_id) {
      if (['voting_started', 'plan_unsuccessful', 'plan_successful'].includes(notification.type)) {
        navigate(createPageUrl('Chat') + `?planId=${notification.plan_id}`);
      } else {
        navigate(createPageUrl('PlanDetails') + `?id=${notification.plan_id}`);
      }
    } else if (notification.related_user_id) {
      navigate(createPageUrl('UserProfile') + `?id=${notification.related_user_id}`);
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-24">
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 p-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-900"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Notificações</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400">{unreadCount} não lidas</p>
            )}
          </div>
        </div>
      </header>

      <main className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
          </div>
        ) : sortedNotifications.length > 0 ? (
          <div className="space-y-2">
            {sortedNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || AlertCircle;
              const colorClass = notificationColors[notification.type] || 'bg-gray-500/20 text-gray-400';
              
              return (
                <motion.button
                  key={notification.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    notification.is_read 
                      ? 'bg-gray-900/50 border-gray-800' 
                      : 'bg-gray-900 border-[#00fea3]/30'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${notification.is_read ? 'text-gray-400' : 'text-white'}`}>
                        {notification.title || notification.message}
                      </p>
                      {notification.title && (
                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-2">
                        {format(new Date(notification.created_date), 'dd MMM, HH:mm')}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-[#00fea3] flex-shrink-0 mt-2" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Sem notificações</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, Plus, MessageCircle, User, Bell } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNotifications } from '../notifications/NotificationProvider';

const navItems = [
  { icon: Home, label: 'Feed', page: 'Home' },
  { icon: Compass, label: 'Explore', page: 'Explore' },
  { icon: Plus, label: 'Add', page: 'CreatePlan', isSpecial: true },
  { icon: Bell, label: 'Notificações', page: 'Notifications' },
  { icon: User, label: 'Profile', page: 'Profile' }
];

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0b0b0b]/95 backdrop-blur-lg border-t border-gray-800 px-4 py-2 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const url = createPageUrl(item.page);
          const isActive = currentPath === url || currentPath === `/${item.page}`;
          
          if (item.isSpecial) {
            return (
              <Link key={item.page} to={url}>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00fea3] to-[#542b9b] flex items-center justify-center shadow-lg shadow-[#00fea3]/20"
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link key={item.page} to={url}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 py-2 px-4 relative"
              >
                <Icon 
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-[#00fea3]' : 'text-gray-500'
                  }`} 
                />
                {item.page === 'Notifications' && unreadCount > 0 && (
                  <div className="absolute top-1 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
                <span className={`text-[10px] transition-colors ${
                  isActive ? 'text-[#00fea3]' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="w-1 h-1 rounded-full bg-[#00fea3]"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
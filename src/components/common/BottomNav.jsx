import React, { useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, Plus, MessageCircle, User } from 'lucide-react';
import { createPageUrl } from '@/utils';

const navItems = [
  { icon: Home, label: 'Feed', page: 'Home' },
  { icon: Compass, label: 'Explore', page: 'Explore' },
  { icon: Plus, label: 'Add', page: 'CreatePlan', isSpecial: true },
  { icon: MessageCircle, label: 'Messages', page: 'Chat' },
  { icon: User, label: 'Profile', page: 'Profile' }
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleTabPress = (item) => {
    const url = createPageUrl(item.page);
    const isActive = currentPath === url || currentPath === `/${item.page}`;

    if (isActive) {
      // Already on this tab — scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(url);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[#0b0b0b]/95 backdrop-blur-lg border-t border-gray-800 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const url = createPageUrl(item.page);
          const isActive = currentPath === url || currentPath === `/${item.page}`;

          if (item.isSpecial) {
            return (
              <motion.button
                key={item.page}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTabPress(item)}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00fea3] to-[#542b9b] flex items-center justify-center shadow-lg shadow-[#00fea3]/20"
              >
                <Icon className="w-6 h-6 text-white" />
              </motion.button>
            );
          }

          return (
            <motion.button
              key={item.page}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTabPress(item)}
              className="flex flex-col items-center gap-1 py-2 px-4 relative"
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive ? 'text-[#00fea3]' : 'text-gray-500'
                }`}
              />
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
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
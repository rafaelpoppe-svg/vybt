import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Compass, PlusCircle, MessageCircle, User } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const tabs = [
  { name: 'Home',       icon: Home,          label: 'Home' },
  { name: 'Explore',    icon: Compass,       label: 'Explore' },
  { name: 'CreatePlan', icon: PlusCircle,    label: 'Create' },
  { name: 'Chat',       icon: MessageCircle, label: 'Messages' },
  { name: 'Profile',    icon: User,          label: 'Profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (pageName) => {
    const path = location.pathname;
    return path === `/${pageName}` || path.endsWith(`/${pageName}`);
  };

  const handleTabPress = (pageName) => {
    if (isActive(pageName)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(createPageUrl(pageName));
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b0b0b]/95 backdrop-blur-xl border-t border-gray-800/60"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ name, icon: Icon, label }) => {
          const active = isActive(name);
          return (
            <motion.button
              key={name}
              whileTap={{ scale: 0.85 }}
              onClick={() => handleTabPress(name)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl relative"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-[#00fea3]/10 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                />
              )}
              {name === 'CreatePlan' ? (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00fea3] to-[#542b9b] flex items-center justify-center shadow-lg shadow-[#00fea3]/20 -mt-5">
                  <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
              ) : (
                <>
                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${active ? 'text-[#00fea3]' : 'text-gray-500'}`}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  <span className={`text-[10px] font-medium transition-colors duration-200 ${active ? 'text-[#00fea3]' : 'text-gray-600'}`}>
                    {label}
                  </span>
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
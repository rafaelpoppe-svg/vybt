import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Compass, PlusCircle, MessageCircle, User, Camera, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';

// Labels are now dynamic via t(), defined inside component

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);

  const tabs = [
    { name: 'Home',       icon: Home,          label: t.home },
    { name: 'Explore',    icon: Compass,       label: t.explore },
    { name: 'CreatePlan', icon: PlusCircle,    label: t.create },
    { name: 'Chat',       icon: MessageCircle, label: t.messages },
    { name: 'Profile',    icon: User,          label: t.profile },
  ];

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b0b0b]/90 backdrop-blur-2xl border-t border-[#00fea3]/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ name, icon: Icon, label }) => {
          const active = isActive(name);
          return (
            <motion.button
              key={name}
              whileTap={{ scale: 0.8, rotate: -3 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => handleTabPress(name)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl relative"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, #00fea322, #542b9b22)' }}
                  transition={{ type: 'spring', bounce: 0.35, duration: 0.45 }}
                />
              )}
              {name === 'CreatePlan' ? (
                <motion.div
                  animate={{ rotate: showMenu ? 45 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00fea3] to-[#542b9b] flex items-center justify-center shadow-lg shadow-[#00fea3]/30 -mt-6"
                  style={{ boxShadow: '0 0 20px #00fea340, 0 4px 20px #542b9b40' }}
                >
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <>
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-colors duration-200 ${active ? 'text-[#00fea3]' : 'text-gray-500'}`}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                    {active && (
                      <motion.div
                        layoutId={`dot-${name}`}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00fea3]"
                        transition={{ type: 'spring', bounce: 0.5 }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold transition-colors duration-200 ${active ? 'text-[#00fea3]' : 'text-gray-600'}`}>
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
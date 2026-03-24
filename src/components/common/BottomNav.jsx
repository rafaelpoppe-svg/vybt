import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Compass, PlusCircle, MessageCircle, User, Camera } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useNotifications } from '../notifications/NotificationProvider';
import { useTabHistory } from '@/lib/TabHistoryContext';

// Labels are now dynamic via t(), defined inside component

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { unreadDMCount } = useNotifications();
  const [showMenu, setShowMenu] = useState(false);
  const { resetTab, saveScroll, getScroll } = useTabHistory();

  const tabs = [
    { name: 'Home',       icon: Home,          label: t.home },
    { name: 'Explore',    icon: Compass,       label: t.explore },
    { name: 'CreatePlan', icon: PlusCircle,    label: t.create },
    { name: 'Chat',       icon: MessageCircle, label: t.messages },
    { name: 'Profile',    icon: User,          label: t.profile },
  ];

  const isActive = useCallback((pageName) => {
    const path = location.pathname;
    return path === `/${pageName}` || path === '/' && pageName === 'Home' || path.endsWith(`/${pageName}`);
  }, [location.pathname]);

  const handleTabPress = useCallback((pageName) => {
    const active = isActive(pageName);
    if (active) {
      // Scroll-to-top: find first scrollable container in main area
      const scrollable = document.querySelector('[data-tab-scroll]');
      if (scrollable) scrollable.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Save current scroll before leaving
      const scrollable = document.querySelector('[data-tab-scroll]');
      if (scrollable) saveScroll(location.pathname, scrollable.scrollTop);
      // Reset the target tab's stack to its root
      resetTab(pageName, `/${pageName}`);
      navigate(createPageUrl(pageName));
    }
  }, [isActive, location.pathname, navigate, resetTab, saveScroll]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            style={{ zindex: 699}}
            onClick={() => setShowMenu(false)}
          />
        )}
      </AnimatePresence>

      {/* Popup menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed flex flex-col gap-3 items-center"
            style={{ zIndex: 701, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)', left: '50%', transform: 'translateX(-50%)' }}
          >
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => { setShowMenu(false); navigate(createPageUrl('AddStory')); }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-[#00d4ff]/40 shadow-lg shadow-[#00d4ff]/20" style={{ background: 'var(--nav-bg)' }}
            >
              <div className="w-8 h-8 rounded-full bg-[#00d4ff]/20 flex items-center justify-center">
                <Camera className="w-4 h-4 text-[#00d4ff]" />
              </div>
              <span className="font-semibold text-sm whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{t.addStory}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => { setShowMenu(false); navigate(createPageUrl('CreatePlan')); }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-[#00c6d2]/40 shadow-lg shadow-[#00c6d2]/20" style={{ background: 'var(--nav-bg)' }}
            >
              <div className="w-8 h-8 rounded-full bg-[#00c6d2]/20 flex items-center justify-center">
                <PlusCircle className="w-4 h-4 text-[#00c6d2]" />
              </div>
              <span className="font-semibold text-sm whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{t.createNewPlan}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 border-t border-[#00c6d2]/10"
        style={{ left: 0, right: 0, width: '100%', zIndex: 700, paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)', background: 'var(--nav-bg)' }}
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
              className="flex flex-col items-center gap-0.5 rounded-2xl relative"
              style={{ minWidth: 44, minHeight: 44, padding: '6px 10px' }}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, #00c6d222, #542b9b22)' }}
                  transition={{ type: 'spring', bounce: 0.35, duration: 0.45 }}
                />
              )}
              {name === 'CreatePlan' ? (
                <motion.div
                  animate={{ rotate: showMenu ? 45 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00c6d2] to-[#542b9b] flex items-center justify-center shadow-lg shadow-[#00c6d2]/30 -mt-6"
                  style={{ boxShadow: '0 0 20px #00c6d240, 0 4px 20px #542b9b40' }}
                >
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <>
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-colors duration-200 ${active ? 'text-[#00c6d2]' : 'text-gray-500'}`}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                    {name === 'Chat' && unreadDMCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#00c6d2] text-[#0b0b0b] text-[9px] font-black px-1">
                        {unreadDMCount > 99 ? '99+' : unreadDMCount}
                      </span>
                    )}
                    {active && (
                      <motion.div
                        layoutId={`dot-${name}`}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00c6d2]"
                        transition={{ type: 'spring', bounce: 0.5 }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold transition-colors duration-200 ${active ? 'text-[#00c6d2]' : 'text-gray-600'}`}>
                    {label}
                  </span>
                </>
              )}
            </motion.button>
          );
        })}
        </div>
      </nav>
    </>
  );
}
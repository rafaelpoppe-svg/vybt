/**
 * PageTransition — wraps page content with a native-like slide animation.
 * Slides in from the right when navigating forward, from the left when going back.
 * On tab-bar navigation (main tabs), uses a simpler fade+scale transition.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const TAB_PAGES = ['Home', 'Explore', 'CreatePlan', 'Chat', 'Profile'];

// Determine if a pathname belongs to a main tab
function isTabPage(pathname) {
  return TAB_PAGES.some(p =>
    pathname === `/${p}` || pathname.endsWith(`/${p}`)
  );
}

const tabVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.97 },
};

const slideVariants = {
  initial: { opacity: 0, x: '6%' },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: '-3%' },
};

export default function PageTransition({ children }) {
  const location = useLocation();
  const isTab = isTabPage(location.pathname);
  const variants = isTab ? tabVariants : slideVariants;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ width: '100%', minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
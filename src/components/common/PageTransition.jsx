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

const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

export default function PageTransition({ children }) {
  const location = useLocation();
  const isTab = isTabPage(location.pathname);

  if (isTab) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, overflowX: 'hidden' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
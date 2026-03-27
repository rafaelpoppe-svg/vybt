/**
 * PageTransition — simple fade transition between pages.
 * No slide/translate animations: those expose adjacent screens during iOS back-swipe.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  // No animation wrapper — just render children directly.
  // Framer Motion AnimatePresence with position:absolute siblings was the root cause
  // of the iOS horizontal swipe bug (both pages mounted side-by-side during transition).
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        background: 'var(--bg)',
        // Block ALL horizontal touch gestures at this level
        touchAction: 'pan-y pinch-zoom',
        overscrollBehaviorX: 'none',
      }}
    >
      {children}
    </div>
  );
}
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StoryViewContent from './StoryViewContent';

/**
 * Renders StoryView as a fullscreen overlay on top of the current page.
 * Usage: <StoryViewOverlay storyId={id} onClose={() => setStoryId(null)} originRect={rect} />
 * originRect: DOMRect of the clicked element for hero expand animation
 */
export default function StoryViewOverlay({ storyId, onClose, scope = null, originRect = null }) {
  // Calculate initial transform based on the clicked element's position
  const getInitial = () => {
    if (!originRect) return { opacity: 0, scale: 0.85, borderRadius: '50%' };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = originRect.left + originRect.width / 2;
    const cy = originRect.top + originRect.height / 2;
    const scaleX = originRect.width / vw;
    const scaleY = originRect.height / vh;
    const scale = Math.min(scaleX, scaleY);
    const translateX = cx - vw / 2;
    const translateY = cy - vh / 2;
    return { opacity: 0.6, scale, x: translateX, y: translateY, borderRadius: '50%' };
  };

  return (
    <AnimatePresence>
      {storyId && (
        <motion.div
          key="story-overlay"
          initial={getInitial()}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0, borderRadius: '0%' }}
          exit={{ opacity: 0, scale: 0.95, borderRadius: '16px' }}
          transition={{ type: 'spring', stiffness: 320, damping: 30, opacity: { duration: 0.15 } }}
          className="fixed inset-0 overflow-hidden"
          style={{ zIndex: 800, transformOrigin: 'center center' }}
        >
          <StoryViewContent initialStoryId={storyId} onClose={onClose} scope={scope} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
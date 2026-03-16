import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StoryViewContent from './StoryViewContent';

/**
 * Renders StoryView as a fullscreen overlay on top of the current page.
 * Usage: <StoryViewOverlay storyId={id} onClose={() => setStoryId(null)} />
 */
export default function StoryViewOverlay({ storyId, onClose }) {
  return (
    <AnimatePresence>
      {storyId && (
        <motion.div
          key="story-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50"
        >
          <StoryViewContent initialStoryId={storyId} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
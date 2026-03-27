import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Visual indicator for pull-to-refresh
 */
export default function PullRefreshIndicator({ pullDistance, isRefreshing, threshold = 64 }) {
  const progress = Math.min(pullDistance / threshold, 1);
  const show = pullDistance > 4 || isRefreshing;

  if (!show) return null;

  return (
    <div
      className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-50"
      style={{ transform: `translateY(${isRefreshing ? 44 : pullDistance - 16}px)`, transition: isRefreshing ? 'transform 0.2s' : 'none' }}
    >
      <div 
        className="w-9 h-9 rounded-full border border-white/10 shadow-lg flex items-center justify-center"
        style={{background: 'var(--bg)'}}
      >
        {isRefreshing ? (
          <Loader2 className="w-4 h-4 text-[#00c6d2] animate-spin" />
        ) : (
          <motion.div
            style={{ rotate: progress * 360 }}
            className="w-4 h-4 border-2 border-[#00c6d2]/30 border-t-[#00c6d2] rounded-full"
          />
        )}
      </div>
    </div>
  );
}
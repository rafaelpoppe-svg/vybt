import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTabHistory } from '@/lib/TabHistoryContext';

/**
 * MobileHeader — shows a back button when inside a tab sub-stack,
 * or a title bar when provided. Pass `hidden` to suppress entirely
 * (e.g. the Home page renders its own header).
 */
export default function MobileHeader({ title, hidden, rightSlot, onBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { getStack, getActiveTab, pop } = useTabHistory();

  if (hidden) return null;

  const tab = getActiveTab(location.pathname);
  const stack = tab ? getStack(tab) : [];
  const canGoBack = stack.length > 1;

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (canGoBack) {
      const prev = pop(tab);
      if (prev) navigate(prev, { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-2 z-40 border-b border-white/5"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        height: 48,
        paddingTop: 0,
      }}
    >
      {/* Left — back button or spacer */}
      <div style={{ minWidth: 44 }}>
        {canGoBack && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleBack}
            className="flex items-center justify-center rounded-full"
            style={{ width: 44, height: 44 }}
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          </motion.button>
        )}
      </div>

      {/* Center — title */}
      {title && (
        <h1
          className="font-bold text-base truncate max-w-[55vw] text-center"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
      )}

      {/* Right slot */}
      <div style={{ minWidth: 44 }} className="flex justify-end">
        {rightSlot}
      </div>
    </header>
  );
}
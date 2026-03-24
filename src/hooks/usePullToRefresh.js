import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * usePullToRefresh
 * @param {() => Promise<void>} onRefresh - async function called when user pulls
 * @param {number} threshold - pull distance in px before triggering (default 64)
 * @returns {{ containerRef, pullDistance, isRefreshing }}
 */
export function usePullToRefresh(onRefresh, threshold = 64) {
  const containerRef = useRef(null);
  const startYRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    // Only activate when scrolled to top
    if (el.scrollTop > 0) return;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startYRef.current === null || isRefreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) { startYRef.current = null; return; }
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy <= 0) return;
    // Rubber-band damping
    setPullDistance(Math.min(dy * 0.45, threshold * 1.5));
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);
      try { await onRefresh(); } catch (_) {}
      setIsRefreshing(false);
    } else {
      setPullDistance(0);
    }
    startYRef.current = null;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef, pullDistance, isRefreshing };
}
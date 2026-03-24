import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TAB_ROOTS = ['Home', 'Explore', 'Chat', 'Profile', 'Notifications', 'Friends', 'MyPlans', 'MyStories'];

const TabHistoryContext = createContext(null);

export function TabHistoryProvider({ children }) {
  // Each tab root → array of { pathname, title }
  const stacksRef = useRef({});
  // Scroll positions per route
  const scrollPositions = useRef({});
  // Force re-renders when stack changes
  const [, forceUpdate] = useState(0);

  const getActiveTab = useCallback((pathname) => {
    const seg = pathname.replace(/^\//, '') || 'Home';
    return TAB_ROOTS.find(t => seg === t || seg.startsWith(t + '/')) || null;
  }, []);

  const push = useCallback((pathname, title = '') => {
    const tab = getActiveTab(pathname);
    if (!tab) return;
    const stack = stacksRef.current[tab] || [];
    // Avoid duplicate top entry
    if (stack.length && stack[stack.length - 1].pathname === pathname) return;
    stacksRef.current[tab] = [...stack, { pathname, title }];
    forceUpdate(n => n + 1);
  }, [getActiveTab]);

  const pop = useCallback((tab) => {
    const stack = stacksRef.current[tab] || [];
    if (stack.length <= 1) return null;
    const next = [...stack];
    next.pop();
    stacksRef.current[tab] = next;
    forceUpdate(n => n + 1);
    return next[next.length - 1]?.pathname || null;
  }, []);

  const resetTab = useCallback((tab, rootPath) => {
    stacksRef.current[tab] = [{ pathname: rootPath, title: tab }];
    forceUpdate(n => n + 1);
  }, []);

  const getStack = useCallback((tab) => stacksRef.current[tab] || [], []);

  const saveScroll = useCallback((key, y) => { scrollPositions.current[key] = y; }, []);
  const getScroll = useCallback((key) => scrollPositions.current[key] || 0, []);

  const updateTitle = useCallback((pathname, title) => {
    const tab = getActiveTab(pathname);
    if (!tab) return;
    const stack = stacksRef.current[tab] || [];
    const idx = stack.findLastIndex(e => e.pathname === pathname);
    if (idx >= 0) {
      stack[idx] = { ...stack[idx], title };
      forceUpdate(n => n + 1);
    }
  }, [getActiveTab]);

  return (
    <TabHistoryContext.Provider value={{ push, pop, resetTab, getStack, getActiveTab, saveScroll, getScroll, updateTitle }}>
      {children}
    </TabHistoryContext.Provider>
  );
}

export function useTabHistory() {
  const ctx = useContext(TabHistoryContext);
  if (!ctx) throw new Error('useTabHistory must be inside TabHistoryProvider');
  return ctx;
}
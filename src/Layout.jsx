import React, { useState, useEffect, useRef } from 'react';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { Toaster } from 'sonner';
import PageTransition from '@/components/common/PageTransition';
import { LanguageProvider } from '@/components/common/LanguageContext';
import { ProfileThemeProvider } from '@/components/common/ProfileThemeContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

function LayoutContent({ children, currentPageName }) {
  const [authChecked, setAuthChecked] = useState(false);
  const isAuthenticatedRef = useRef(false);
  const navigate = useNavigate();

  const publicPages = ['Welcome', 'Support', 'TermsConditions', 'CommunityGuidelines', 'PrivacyPolicy', 'HelpFaq'];
  const protectedPages = ['Home', 'AddStory', 'Friends', 'Chat', 'GroupChat', 'Profile', 'MyPlans', 'CreatePlan', 'PlanDetails', 'Explore', 'MyStories', 'EditProfile', 'Settings', 'Notifications', 'NotificationSettings', 'Ambassador', 'WelcomePrograms', 'StoryView', 'UserProfile', 'Onboarding', 'Moderation'];

  // Block pinch-to-zoom and horizontal swipe
  useEffect(() => {
    const preventGesture = (e) => e.preventDefault();
    const preventDoubleZoom = (() => {
      let lastTap = 0;
      return (e) => {
        const now = Date.now();
        if (now - lastTap < 300) e.preventDefault();
        lastTap = now;
      };
    })();

    let touchStartX = 0;
    let touchStartY = 0;
    const preventHorizontalSwipe = (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const blockHorizontalMove = (e) => {
      if (e.touches.length !== 1) return;
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dx > dy && dx > 8) {
        if (!e.target.closest('[data-hscroll]')) e.preventDefault();
      }
    };

    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    document.addEventListener('touchstart', preventDoubleZoom, { passive: false });
    document.addEventListener('touchstart', preventHorizontalSwipe, { passive: true });
    document.addEventListener('touchmove', blockHorizontalMove, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchstart', preventDoubleZoom);
      document.removeEventListener('touchstart', preventHorizontalSwipe);
      document.removeEventListener('touchmove', blockHorizontalMove);
    };
  }, []);

  // Auth check
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      const isMobileApp = !!(window.Capacitor || window.cordova || navigator.userAgent.includes('VybtApp') || window.location.protocol === 'capacitor:');

      try {
        const user = await base44.auth.me();
        if (user) {
          isAuthenticatedRef.current = true;
          if (currentPageName === 'Welcome' && !isPreview) {
            navigate(createPageUrl('Home'));
          }
        } else {
          if (!isAuthenticatedRef.current) {
            if (protectedPages.includes(currentPageName)) {
              navigate(createPageUrl('Welcome'));
            } else if (currentPageName === 'Welcome' && isMobileApp) {
              base44.auth.redirectToLogin();
            }
          }
        }
      } catch (e) {
        if (!isAuthenticatedRef.current && protectedPages.includes(currentPageName)) {
          navigate(createPageUrl('Welcome'));
        }
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuthAndRedirect();
  }, [currentPageName]);

  if (!authChecked) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0b0b0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00c6d2]" />
      </div>
    );
  }

  return (
    <LanguageProvider>
      <NotificationProvider>
        <Toaster position="top-center" theme="dark" />
        {/* Wrapper fixo que cobre TODO o ecrã incluindo safe areas */}
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#0b0b0b',
          overflowX: 'hidden',
          overflowY: 'auto',
          touchAction: 'pan-y pinch-zoom',
          overscrollBehavior: 'none',
        }}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </NotificationProvider>
    </LanguageProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ProfileThemeProvider>
      <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
    </ProfileThemeProvider>
  );
}
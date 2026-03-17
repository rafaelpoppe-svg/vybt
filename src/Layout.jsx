import React, { useState, useEffect, useRef } from 'react';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { Toaster } from 'sonner';
import PageTransition from '@/components/common/PageTransition';
import { LanguageProvider } from '@/components/common/LanguageContext';
import { ProfileThemeProvider, useProfileThemeContext } from '@/components/common/ProfileThemeContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

function LayoutContent({ children, currentPageName, profileTheme }) {
  const [authChecked, setAuthChecked] = useState(false);
  const isAuthenticatedRef = React.useRef(false);
  const navigate = useNavigate();

  // Block pinch-to-zoom, gesture zoom, and horizontal swipe on iOS WebView
  useEffect(() => {
    const preventGesture = (e) => e.preventDefault();

    // Block double-tap zoom
    const preventDoubleZoom = (() => {
      let lastTap = 0;
      return (e) => {
        const now = Date.now();
        if (now - lastTap < 300) e.preventDefault();
        lastTap = now;
      };
    })();

    // Block horizontal swipe gestures (iOS back/forward navigation in WKWebView)
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
      // If primarily horizontal, prevent default (blocks WKWebView back swipe)
      if (dx > dy && dx > 8) {
        // Only block if the target doesn't have explicit horizontal scroll
        const el = e.target;
        const scrollable = el.closest('[data-hscroll]');
        if (!scrollable) e.preventDefault();
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

  // Páginas públicas que não requerem autenticação
  const publicPages = ['Welcome', 'Support', 'TermsConditions', 'CommunityGuidelines', 'PrivacyPolicy', 'HelpFaq'];
  // Páginas protegidas que requerem autenticação
  const protectedPages = ['Home', 'AddStory', 'Friends', 'Chat', 'GroupChat', 'Profile', 'MyPlans', 'CreatePlan', 'PlanDetails', 'Explore', 'MyStories', 'EditProfile', 'Settings', 'Notifications', 'NotificationSettings', 'Ambassador', 'WelcomePrograms', 'StoryView', 'UserProfile', 'Onboarding', 'Moderation'];

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      const isMobileApp = !!(window.Capacitor || window.cordova || navigator.userAgent.includes('VybtApp') || window.location.protocol === 'capacitor:');

      try {
        const user = await base44.auth.me();

        if (user) {
          // Mark as authenticated so future errors don't kick user out
          isAuthenticatedRef.current = true;
          if (currentPageName === 'Welcome' && !isPreview) {
            navigate(createPageUrl('Home'));
            return;
          }
        } else {
          // Only redirect if we've never confirmed auth before
          if (!isAuthenticatedRef.current) {
            if (protectedPages.includes(currentPageName)) {
              navigate(createPageUrl('Welcome'));
              return;
            }
            if (currentPageName === 'Welcome' && isMobileApp) {
              base44.auth.redirectToLogin();
              return;
            }
          }
        }
      } catch (e) {
        // CRITICAL: only redirect to Welcome if we have never confirmed the user was authenticated.
        // This prevents a transient network/token error from logging the user out mid-session.
        if (!isAuthenticatedRef.current && protectedPages.includes(currentPageName)) {
          navigate(createPageUrl('Welcome'));
          return;
        }
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuthAndRedirect();
  }, [currentPageName]);

  // Inject critical iOS meta tags + force bg color as early as possible
  useEffect(() => {
    // Force background immediately — prevents white flash on iOS WebView
    /*document.documentElement.style.cssText += ';background:#0b0b0b!important;background-color:#0b0b0b!important;overflow:hidden!important;margin:0!important;padding:0!important;height:100%!important;';
    document.body.style.cssText += ';background:#0b0b0b!important;background-color:#0b0b0b!important;overflow:hidden!important;margin:0!important;padding:0!important;height:100%!important;';

    const root = document.getElementById('root');
    if (root) {
      root.style.cssText += ';background:#0b0b0b!important;height:100%!important;min-height:100%!important;';
    }*/
    document.documentElement.style.border = '4px solid red';
    document.body.style.border = '4px solid blue';
    const rootTest = document.getElementById('root');
    if (rootTest) rootTest.style.border = '4px solid green';

    document.body.style.cssText += ';background:#0b0b0b!important;background-color:#0b0b0b!important;overflow:hidden!important;margin:0!important;padding:0!important;height:100%!important;';

    // theme-color
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) { themeMeta = document.createElement('meta'); themeMeta.name = 'theme-color'; document.head.prepend(themeMeta); }
    themeMeta.content = '#0b0b0b';

    // apple status bar style — black-translucent extends content under status bar
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) { appleMeta = document.createElement('meta'); appleMeta.name = 'apple-mobile-web-app-status-bar-style'; document.head.prepend(appleMeta); }
    appleMeta.content = 'black-translucent';

    // apple-mobile-web-app-capable
    let capableMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!capableMeta) { capableMeta = document.createElement('meta'); capableMeta.name = 'apple-mobile-web-app-capable'; document.head.prepend(capableMeta); }
    capableMeta.content = 'yes';

    // viewport — force no-zoom, no-scale, edge-to-edge on iPhone notch/Dynamic Island
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const viewportContent = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    if (viewportMeta) {
      viewportMeta.content = viewportContent;
    } else {
      const vm = document.createElement('meta');
      vm.name = 'viewport';
      vm.content = viewportContent;
      document.head.prepend(vm);
    }
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00c6d2]" />
      </div>
    );
  }

  // Get theme styles
  const themeStyles = profileTheme ? getThemeStyles(profileTheme) : null;

  return (
    <LanguageProvider>
    <NotificationProvider>
      <Toaster position="top-center" theme="dark" />
      {/* 
        Root wrapper: fixed, edge-to-edge.
        Uses inset:0 so it covers status bar on iOS (with viewport-fit=cover).
      */}
      <div style={{
        width: '100%',
        height: '100dvh',
        minHeight: '100dvh',
        position: 'fixed',
        top: '-100px',        // ADICIONA — estende para cima da status bar
        left: 0,
        right: 0,
        bottom: '-100px',     // ADICIONA — estende para baixo da nav bar
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 100px)',   // compensa o top negativo
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)', // compensa o bottom negativo
        display: 'flex',
        flexDirection: 'column',
        background: themeStyles?.background || '#0b0b0b',
        overflowX: 'hidden',
        overflowY: 'auto',
        touchAction: 'pan-y pinch-zoom',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        <style>{`
          /* Force dark color-scheme so iOS renders status bar dark */
          :root { color-scheme: dark; }
          @media (prefers-color-scheme: light) { :root { color-scheme: dark; } }
          /* Block horizontal swipe/overflow everywhere */
          html, body, #root {
            margin: 0;
            padding: 0;
            overflow-x: hidden !important;
            overflow-y: auto !important; 
            max-width: 100vw !important;
            min-height: 100dvh;
            height: 100%;
            background: #0b0b0b !important;
          }
          * { max-width: 100%; box-sizing: border-box; }
          /* Prevent any element from creating horizontal scroll */
          body > #root {
            overflow-x: hidden !important;
            overflow-y: auto !important;
          }
        `}</style>
        <div style={{
          flex: 1,
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#0b0b0b',
          width: '100%',
          maxWidth: '100vw',
          minHeight: '100%',
          touchAction: 'pan-y pinch-zoom',
        }}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </div>
    </NotificationProvider>
    </LanguageProvider>
  );
}

// Helper function to get theme styles
function getThemeStyles(theme) {
  const themes = {
    default: {
      background: '#0b0b0b',
      backgroundImage: 'linear-gradient(135deg, #0b0b0b 0%, #1a1a1a 100%)',
    },
    beer: {
      background: '#2d1810',
      backgroundImage: 'linear-gradient(135deg, #2d1810 0%, #5c3d2e 100%)',
    },
    dance: {
      background: '#1a0a2e',
      backgroundImage: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 100%)',
    },
    champagne: {
      background: '#3d3d2e',
      backgroundImage: 'linear-gradient(135deg, #3d3d2e 0%, #5c5c42 100%)',
    },
    money: {
      background: '#1a2e1a',
      backgroundImage: 'linear-gradient(135deg, #1a2e1a 0%, #2d5c2d 100%)',
    },
    luxury: {
      background: '#1a1a2e',
      backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    },
    party: {
      background: '#2e1a2e',
      backgroundImage: 'linear-gradient(135deg, #2e1a2e 0%, #5c2d5c 100%)',
    },
  };
  return themes[theme] || themes.default;
}

export default function Layout({ children, currentPageName }) {
  const [profileTheme, setProfileTheme] = useState(null);

  return (
    <ProfileThemeProvider>
      <LayoutContent currentPageName={currentPageName} profileTheme={profileTheme}>{children}</LayoutContent>
    </ProfileThemeProvider>
  );
}
import React, { useState, useEffect } from 'react';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { Toaster } from 'sonner';
import PageTransition from '@/components/common/PageTransition';
import { LanguageProvider } from '@/components/common/LanguageContext';
import SplashScreen from '@/components/common/SplashScreen';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const [splashDone, setSplashDone] = useState(() => {
    return !!sessionStorage.getItem('splash_shown');
  });
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  // Block pinch-to-zoom and gesture zoom on iOS WebView
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

    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    document.addEventListener('touchstart', preventDoubleZoom, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchstart', preventDoubleZoom);
    };
  }, []);

  const handleSplashFinish = () => {
    sessionStorage.setItem('splash_shown', '1');
    setSplashDone(true);
  };

  // Páginas públicas que não requerem autenticação
  const publicPages = ['Welcome', 'Support', 'TermsConditions', 'CommunityGuidelines', 'PrivacyPolicy', 'HelpFaq'];
  // Páginas protegidas que requerem autenticação
  const protectedPages = ['Home', 'AddStory', 'Friends', 'Chat', 'GroupChat', 'Profile', 'MyPlans', 'CreatePlan', 'PlanDetails', 'Explore', 'MyStories', 'EditProfile', 'Settings', 'Notifications', 'NotificationSettings', 'Ambassador', 'WelcomePrograms', 'StoryView', 'UserProfile', 'Onboarding', 'Moderation'];

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      
      // Detect if running as mobile app (Capacitor/native wrapper)
      const isMobileApp = !!(window.Capacitor || window.cordova || navigator.userAgent.includes('VybtApp') || window.location.protocol === 'capacitor:');

      
      try {
        const user = await base44.auth.me();
        
        // Utilizador logado
        if (user) {
          if (currentPageName === 'Welcome' && !isPreview) {
            navigate(createPageUrl('Home'));
            return;
          }
        } else {
          // Utilizador não logado
          // Se tenta aceder a página protegida, redireciona para Welcome
          if (protectedPages.includes(currentPageName)) {
            navigate(createPageUrl('Welcome'));
            return;
          }
          // Mobile app sem login: redireciona Welcome para login direto
          if (currentPageName === 'Welcome' && isMobileApp) {
            base44.auth.redirectToLogin();
            return;
          }
        }
      } catch (e) {
        // Não logado
        if (protectedPages.includes(currentPageName)) {
          navigate(createPageUrl('Welcome'));
          return;
        }
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuthAndRedirect();
  }, [currentPageName, navigate]);

  // Inject critical iOS meta tags + force bg color as early as possible
  useEffect(() => {
    // Force background immediately — prevents white flash on iOS WebView
    document.documentElement.style.cssText += ';background:#0b0b0b!important;background-color:#0b0b0b!important;overflow:hidden!important;margin:0!important;padding:0!important;height:100%!important;';
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

    // viewport — ensure viewport-fit=cover for edge-to-edge on iPhone notch/Dynamic Island
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      if (!viewportMeta.content.includes('viewport-fit')) {
        viewportMeta.content = viewportMeta.content.replace(/,?\s*viewport-fit=\w+/, '') + ', viewport-fit=cover';
      }
    } else {
      const vm = document.createElement('meta');
      vm.name = 'viewport';
      vm.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
      document.head.prepend(vm);
    }
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00fea3]" />
      </div>
    );
  }

  return (
    <LanguageProvider>
    <NotificationProvider>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      <Toaster position="top-center" theme="dark" />
      {/* 
        Root wrapper: fixed, edge-to-edge, black.
        Uses inset:0 so it covers status bar on iOS (with viewport-fit=cover).
      */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100%',
        height: '100%',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0b0b0b',
        overflow: 'hidden',
        overflowX: 'hidden',
        // CRITICAL: prevent iOS WKWebView back-swipe gesture from sliding the layer
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
            overflow-x: hidden !important;
            overscroll-behavior-x: none !important;
            touch-action: pan-y pinch-zoom !important;
            max-width: 100vw !important;
          }
          * { max-width: 100%; box-sizing: border-box; }
          /* Prevent any element from creating horizontal scroll */
          body > #root { overflow: hidden !important; }
        `}</style>
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          overflowX: 'hidden',
          background: '#0b0b0b',
          width: '100%',
          maxWidth: '100vw',
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
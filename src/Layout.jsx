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

  // Inject theme-color meta + force html/body bg before any paint
  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = '#0b0b0b';

    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(appleMeta);
    }
    appleMeta.content = 'black-translucent';

    document.documentElement.style.backgroundColor = '#0b0b0b';
    document.body.style.backgroundColor = '#0b0b0b';
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
      <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0b0b0b', overflow: 'hidden' }}>
        <style>{`
          @media (prefers-color-scheme: light) {
            :root {
              color-scheme: dark;
            }
          }

          /* ── iOS WebView hard reset ── */
          html {
            background-color: #0b0b0b !important;
            background: #0b0b0b !important;
            height: -webkit-fill-available !important;
            height: 100dvh !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            overscroll-behavior: none !important;
          }
          body {
            background-color: #0b0b0b !important;
            background: #0b0b0b !important;
            height: 100% !important;
            min-height: -webkit-fill-available !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            overscroll-behavior: none !important;
            overscroll-behavior-y: none !important;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-x pan-y;
          }

          #root {
            background-color: #0b0b0b !important;
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100% !important;
            min-height: 100dvh !important;
            overflow: hidden !important;
          }

          :root {
            --color-primary: #00fea3;
            --color-secondary: #542b9b;
            --color-background: #0b0b0b;
            --sat: env(safe-area-inset-top, 0px);
            --sab: env(safe-area-inset-bottom, 0px);
            --sal: env(safe-area-inset-left, 0px);
            --sar: env(safe-area-inset-right, 0px);
          }

          html, body {
            background-color: #0b0b0b;
            color: white;
            overscroll-behavior-y: none;
            -webkit-overflow-scrolling: touch;
            height: 100%;
          }

          /* Disable text selection globally for UI elements */
          * {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
          }

          button, nav, header, a, label, 
          [role="button"], [role="tab"],
          .select-none {
            user-select: none;
            -webkit-user-select: none;
          }

          /* Allow selection for content areas */
          p, .bio-text, .selectable,
          input, textarea,
          [contenteditable] {
            user-select: text;
            -webkit-user-select: text;
          }

          /* Safe area top padding for sticky headers */
          .safe-top {
            padding-top: env(safe-area-inset-top, 0px);
          }

          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #444;
          }

          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }

          input[type="date"]::-webkit-calendar-picker-indicator,
          input[type="time"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
          }

          /* Page transition — prevent width overflow flash */
          [data-page-transition] {
            position: relative;
            width: 100%;
            will-change: transform, opacity;
          }

          /* Safe-area helpers */
          .pb-safe {
            padding-bottom: max(env(safe-area-inset-bottom, 0px), 1rem);
          }
          .pt-safe {
            padding-top: max(env(safe-area-inset-top, 0px), 0px);
          }
          .mb-safe {
            margin-bottom: max(env(safe-area-inset-bottom, 0px), 1rem);
          }
        `}</style>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b0b0b', width: '100%' }}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </div>
    </NotificationProvider>
    </LanguageProvider>
  );
}
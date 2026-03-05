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
      <div className="min-h-screen bg-[#0b0b0b]">
        <style>{`
          @media (prefers-color-scheme: light) {
            :root {
              color-scheme: dark;
            }
          }

          /* Fix iOS bounce / white area on scroll */
          html, body {
            background-color: #0b0b0b !important;
            overscroll-behavior: none !important;
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
          }

          #root {
            background-color: #0b0b0b;
            height: 100%;
            overflow: hidden;
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
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </NotificationProvider>
    </LanguageProvider>
  );
}
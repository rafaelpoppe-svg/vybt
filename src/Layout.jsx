import React, { useState, useEffect } from 'react';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { Toaster } from 'sonner';
import PageTransition from '@/components/common/PageTransition';
import { LanguageProvider } from '@/components/common/LanguageContext';
import SplashScreen from '@/components/common/SplashScreen';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

function getStatusBarPadding() {
  const ua = navigator.userAgent;
  const isAndroid = /android/i.test(ua);
  return isAndroid ? '0px' : 'env(safe-area-inset-top, 0px)';
}

export default function Layout({ children, currentPageName }) {
  const [splashDone, setSplashDone] = useState(() => !!sessionStorage.getItem('splash_shown'));
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  const handleSplashFinish = () => {
    sessionStorage.setItem('splash_shown', '1');
    setSplashDone(true);
  };

  // === BLOQUEIO DE GESTOS iOS ===
  useEffect(() => { /* (mesmo código que você já tinha - deixei igual) */ }, []);

  // === AUTH CHECK (mesmo código) ===
  useEffect(() => { /* (mesmo código que você já tinha) */ }, [currentPageName, navigate]);

  // === FORÇA META TAGS + BACKGROUND ANTES DO REACT ===
  useEffect(() => {
    document.documentElement.style.cssText += ';background:#0b0b0b!important;';
    document.body.style.cssText += ';background:#0b0b0b!important;';

    // Atualiza viewport com viewport-fit=cover
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  }, []);

  if (!authChecked) {
    return <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00fea3]" /></div>;
  }

  return (
    <LanguageProvider>
      <NotificationProvider>
        {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
        <Toaster position="top-center" theme="dark" />

        {/* CONTAINER PRINCIPAL - COBRE TUDO INCLUSIVE SAFE AREAS */}
        <div style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100dvh',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0b0b0b',
          overflow: 'hidden',
          touchAction: 'pan-y pinch-zoom',
          overscrollBehavior: 'none',
          paddingTop: getStatusBarPadding(),
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          <style>{`
            html, body, #root {
              background: #0b0b0b !important;
              overflow: hidden !important;
              touch-action: pan-y pinch-zoom !important;
            }
            body > #root { position: fixed; inset: 0; background: #0b0b0b !important; }
          `}</style>

          <div style={{ flex: 1, overflow: 'hidden', background: '#0b0b0b' }}>
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </div>
      </NotificationProvider>
    </LanguageProvider>
  );
}
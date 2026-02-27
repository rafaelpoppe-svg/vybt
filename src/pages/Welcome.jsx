import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/common/LanguageContext';


export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          navigate(createPageUrl('Home'));
        }
      } catch (e) {
        // Utilizador não logado, mostra Welcome
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00fea3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white overflow-hidden">
      {/* Hero Section with transparent header */}
      <div 
        className="relative min-h-screen w-full flex flex-col"
        style={{
          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/88ff4742f_image.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/35"></div>

        {/* Transparent Header */}
        <header className="fixed top-0 left-0 right-0 z-40 p-4 md:p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/4f0b92888_VybtLogoPng.png"
                alt="Vybt"
                className="w-10 h-10 md:w-12 md:h-12 object-contain"
              />
              <h1 className="text-3xl font-black bg-gradient-to-r from-[#00fea3] to-[#542b9b] bg-clip-text text-transparent">
                Vybt
              </h1>
            </div>
            
            {/* Download Now Button - Top Right */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => base44.auth.redirectToLogin()}
              className="px-6 py-2 rounded-full bg-[#00fea3] text-[#0b0b0b] font-bold hover:bg-[#00fea3]/90 transition-all"
            >
              {t.downloadNow}
            </motion.button>
          </div>
        </header>

        {/* Main Content - Full height with flexbox layout */}
        <main className="relative z-10 h-screen flex flex-col items-center justify-center px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 max-w-2xl text-center flex-1 flex flex-col justify-center"
          >
            <h2 className="text-5xl md:text-6xl font-black">
              {t.welcomeHero?.split(',')[0]}, <span className="text-[#00fea3]">{t.welcomeHero?.split(',')[1]?.trim()}</span>
            </h2>
            
            <p className="text-lg md:text-xl text-gray-100 font-light leading-relaxed">
              {t.welcomeSubtitle?.split('\n').map((line, i) => (
                <React.Fragment key={i}>{line}{i === 0 && <br />}</React.Fragment>
              ))}
            </p>
          </motion.div>
          
          {/* App Store Buttons - Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pb-12"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/0606aa490_AppStore.png"
                alt="Download on the App Store"
                className="h-14 md:h-16 object-contain"
              />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/a7352df16_GooglePlay.png"
                alt="Get it on Google Play"
                className="h-14 md:h-16 object-contain"
              />
            </motion.button>
          </motion.div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#0b0b0b] border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; 2026 Vybt. {t.allRightsReserved}</p>
        </div>
      </footer>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';


export default function Welcome() {
  const navigate = useNavigate();
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
        <header className="relative z-40 p-4 md:p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-3xl font-black bg-gradient-to-r from-[#00fea3] to-[#542b9b] bg-clip-text text-transparent">
              Vybt
            </h1>
            
            {/* Download Now Button - Top Right */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => base44.auth.redirectToLogin()}
              className="px-6 py-2 rounded-full bg-[#00fea3] text-[#0b0b0b] font-bold hover:bg-[#00fea3]/90 transition-all"
            >
              Download Now!
            </motion.button>
          </div>
        </header>

        {/* Main Content - Centered */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 max-w-2xl text-center"
          >
            <h2 className="text-6xl md:text-7xl font-black">
              Hey, <span className="text-[#00fea3]">mate!</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-100 font-light leading-relaxed">
              Join us: let's connect and create the best plans<br />
              in your area!!!
            </p>
            
            {/* App Store Buttons - Larger */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto hover:opacity-80 transition-opacity"
              >
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/b09aec4ee_image.png"
                  alt="Download on the App Store"
                  className="h-16 md:h-20 object-contain"
                />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto hover:opacity-80 transition-opacity"
              >
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/0f375ad8a_image.png"
                  alt="Get it on Google Play"
                  className="h-16 md:h-20 object-contain"
                />
              </motion.button>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#0b0b0b] border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; 2026 Vybt. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Apple, Play } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0b0b0b] text-white overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-black bg-gradient-to-r from-[#00fea3] to-[#542b9b] bg-clip-text text-transparent">
            Vybt
          </h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => base44.auth.redirectToLogin()}
            className="px-6 py-2 rounded-full bg-[#00fea3] text-[#0b0b0b] font-bold hover:bg-[#00fea3]/90 transition-all"
          >
            Login
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {/* Hero Section */}
        <section 
          className="relative min-h-screen w-full flex flex-col items-center justify-center text-center overflow-hidden"
          style={{
            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/491e75731_image.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
          
          {/* Content */}
          <div className="relative z-10 px-4 flex flex-col items-center justify-center h-full py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6 max-w-2xl"
            >
              <h2 className="text-5xl md:text-7xl font-black">
                Hey, <span className="text-[#00fea3]">mate!</span>
              </h2>
              
              <p className="text-lg md:text-2xl text-gray-100 font-light leading-relaxed">
                Join us: let's connect and create the best plans<br />
                in your area!!!
              </p>
              
              {/* Download Now Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="mx-auto mt-8 px-8 py-3 rounded-full bg-[#00fea3] text-[#0b0b0b] font-bold text-lg hover:bg-[#00fea3]/90 transition-all"
              >
                Download Now!
              </motion.button>
              
              {/* App Store Buttons */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-full md:w-auto hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/b09aec4ee_image.png"
                    alt="Download on the App Store"
                    className="h-14 object-contain"
                  />
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-full md:w-auto hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/0f375ad8a_image.png"
                    alt="Get it on Google Play"
                    className="h-14 object-contain"
                  />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Placeholder for additional sections */}
        <div className="py-20 text-center text-gray-500">
          [Secções adicionais serão adicionadas aqui]
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0b0b0b]/50 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; 2026 Vybt. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
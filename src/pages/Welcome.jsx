import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Apple, Play } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

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
      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section - Placeholder */}
        <section className="min-h-[60vh] flex flex-col items-center justify-center text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Bem-vindo ao <span className="bg-gradient-to-r from-[#00fea3] to-[#542b9b] bg-clip-text text-transparent">Vybt</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              [Conteúdo principal será adicionado aqui]
            </p>
          </motion.div>
        </section>

        {/* App Store Buttons */}
        <section className="flex flex-col md:flex-row items-center justify-center gap-4 mb-20">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 px-6 py-3 rounded-lg bg-black border border-white hover:bg-gray-900 transition-all"
          >
            <Apple className="w-6 h-6" />
            <div className="text-left">
              <div className="text-xs text-gray-400">Download on the</div>
              <div className="text-lg font-semibold">App Store</div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 px-6 py-3 rounded-lg bg-black border border-white hover:bg-gray-900 transition-all"
          >
            <Play className="w-6 h-6 fill-current" />
            <div className="text-left">
              <div className="text-xs text-gray-400">GET IT ON</div>
              <div className="text-lg font-semibold">Google Play</div>
            </div>
          </motion.button>
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
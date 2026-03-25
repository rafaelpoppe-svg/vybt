import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, PartyPopper } from 'lucide-react';
import { useLanguage } from '@/components/common/LanguageContext';

export default function WelcomeComplete({ onExplore }) {
  const { t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 py-8"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#00c6d2] to-[#542b9b] flex items-center justify-center"
      >
        <PartyPopper className="w-12 h-12 text-white" />
      </motion.div>

      <div>
        <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{t.welcomeTitle}</h1>
        <p className="text-xl text-[#00c6d2] font-medium">{t.accountReady}</p>
      </div>

      <div className="space-y-4 max-w-xs mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Sparkles className="w-6 h-6 text-[#00c6d2]" />
          <span style={{ color: 'var(--text-secondary)' }}>{t.searchPlansTonight}</span>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <MapPin className="w-6 h-6 text-[#542b9b]" />
          <span style={{ color: 'var(--text-secondary)' }}>{t.explorePlansLocation}</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onExplore}
        className="w-full max-w-xs mx-auto py-4 px-8 rounded-full bg-gradient-to-r from-[#00c6d2] to-[#542b9b] text-white font-bold text-lg shadow-lg shadow-[#00c6d2]/20"
      >
        {t.letsGo}
      </motion.button>
    </motion.div>
  );
}
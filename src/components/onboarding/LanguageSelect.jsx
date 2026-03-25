import React from 'react';
import { motion } from 'framer-motion';
import { translations } from '@/components/common/LanguageContext';

const LANGUAGES = ['en', 'pt', 'es', 'fr', 'it'];

export default function LanguageSelect({ selected, onSelect }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {translations[selected]?.chooseLanguage || translations.en.chooseLanguage}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          {translations[selected]?.languageSubtitle || translations.en.languageSubtitle}
        </p>
      </div>

      <div className="space-y-3">
        {LANGUAGES.map((lang) => {
          const info = translations[lang];
          const isSelected = selected === lang;
          return (
            <motion.button
              key={lang}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(lang)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${
                isSelected ? 'bg-[#00fea3]/10 border-[#00fea3]' : ''
              }`}
              style={!isSelected ? { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' } : { color: 'var(--text-primary)' }}
            >
              <span className="text-3xl">{info.flag}</span>
              <span className="text-lg font-semibold">{info.name}</span>
              {isSelected && (
                <span className="ml-auto w-5 h-5 rounded-full bg-[#00fea3] flex items-center justify-center">
                  <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
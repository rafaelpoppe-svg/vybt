import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

export default function NameSelect({ value, onChange }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t.whatsYourName}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{t.nameSubtitle}</p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.yourNamePlaceholder}
          maxLength={30}
          className="w-full focus:border-[#00fea3] rounded-2xl py-4 pl-12 pr-4 text-lg outline-none transition-colors border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          autoFocus
        />
      </motion.div>
      {value.length > 0 && (
        <p className="text-sm text-right" style={{ color: 'var(--text-muted)' }}>{value.length}/30</p>
      )}
    </div>
  );
}
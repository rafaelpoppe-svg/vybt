import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

export default function NameSelect({ value, onChange }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">{t.whatsYourName}</h2>
        <p className="text-gray-400">{t.nameSubtitle}</p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.yourNamePlaceholder}
          maxLength={30}
          className="w-full bg-gray-900 border border-gray-700 focus:border-[#00fea3] text-white placeholder-gray-500 rounded-2xl py-4 pl-12 pr-4 text-lg outline-none transition-colors"
          autoFocus
        />
      </motion.div>
      {value.length > 0 && (
        <p className="text-gray-600 text-sm text-right">{value.length}/30</p>
      )}
    </div>
  );
}
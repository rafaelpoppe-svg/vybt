import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../common/LanguageContext';

export default function GenderSelect({ selected, onSelect }) {
  const { t } = useLanguage();

  const genderOptions = [
    { id: 'female', icon: '♀' },
    { id: 'male', icon: '♂' },
    { id: 'other', icon: '⚧' }
  ];

  const labels = { female: t.female, male: t.male, other: t.other };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t.whatsYourGender}</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.genderSubtitle}</p>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {genderOptions.map((option) => (
          <motion.button
            key={option.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(option.id)}
            className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center ${
              selected === option.id ? 'border-[#00fea3] bg-[#00fea3]/10' : ''
            }`}
            style={selected !== option.id ? { borderColor: 'var(--border)', background: 'var(--surface)' } : {}}
            >
              <div className="text-4xl mb-3">{option.icon}</div>
              <span className={`font-medium ${selected === option.id ? 'text-[#00fea3]' : ''}`} style={selected !== option.id ? { color: 'var(--text-primary)' } : {}}>
              {labels[option.id]}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
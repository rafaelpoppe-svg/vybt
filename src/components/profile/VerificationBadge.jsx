import React from 'react';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

export default function VerificationBadge({ isVerified, size = 'md', showUnverified = true }) {
  const { t } = useLanguage();

  const sizes = {
    sm: { icon: 'w-3 h-3', text: 'text-[10px]', padding: 'px-1.5 py-0.5', gap: 'gap-0.5' },
    md: { icon: 'w-3.5 h-3.5', text: 'text-xs', padding: 'px-2 py-1', gap: 'gap-1' },
    lg: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-2.5 py-1', gap: 'gap-1' },
    xs: { icon: 'w-2.5 h-2.5', text: 'text-[8px]', padding: 'px-1 py-0.5', gap: 'gap-0.5' },
  };
  const s = sizes[size] || sizes.md;

  if (isVerified) {
    return (
      <span className={`inline-flex items-center ${s.gap} ${s.padding} rounded-full bg-blue-500/20 border border-blue-500/40`}>
        <ShieldCheck className={`${s.icon} text-blue-400`} />
        <span className={`${s.text} text-blue-400 font-semibold`}>{t.verified}</span>
      </span>
    );
  }

  if (!showUnverified) return null;

  return (
    <span className={`inline-flex items-center ${s.gap} ${s.padding} rounded-full bg-gray-700/50 border border-gray-600/40`}>
      <ShieldX className={`${s.icon} text-gray-500`} />
      <span className={`${s.text} text-gray-500 font-medium`}>{t.notVerified}</span>
    </span>
  );
}
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, CheckCircle2 } from 'lucide-react';
import VybtPlusModal from './VybtPlusModal';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../common/LanguageContext.jsx';

export default function VybtPlusBanner({ profile, currentUser, compact = false }) {
  const { t } = useLanguage();

  const HIGHLIGHTS = [t.unlimitedHighlights, t.exclusiveBadge, t.anyCity, t.prioritySupport];
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const isActive = profile?.vybt_plus && (!profile?.vybt_plus_expires_at || new Date(profile.vybt_plus_expires_at) > new Date());

  const handleSuccess = () => {
    queryClient.invalidateQueries(['myProfile', currentUser?.id]);
  };

  if (isActive) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(0,198,210,0.15), rgba(84,43,155,0.15))', border: '1px solid rgba(0,198,210,0.3)' }}>
        <Zap className="w-4 h-4" style={{ color: '#00c6d2' }} />
        <span className="font-bold text-sm" style={{ color: '#00c6d2' }}>{t.vybtPlusActive}</span>
        {profile.vybt_plus_expires_at && (
          <span className="text-xs ml-auto" style={{ color: '#6b7280' }}>
            {t.vybtPlusUntil.replace('{date}', new Date(profile.vybt_plus_expires_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }))}
          </span>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl w-full"
          style={{ background: 'linear-gradient(135deg, #00c6d2, #542b9b)' }}
        >
          <Zap className="w-4 h-4" style={{ color: '#ffffff' }} />
          <span className="font-bold text-sm flex-1 text-left" style={{ color: '#ffffff' }}>VybtPlus</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>€4.99{t.perMonth}</span>
          <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.7)' }} />
        </motion.button>
        <VybtPlusModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
      </>
    );
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowModal(true)}
        className="w-full rounded-3xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 100%)', border: '1px solid rgba(0,198,210,0.25)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #00c6d2, transparent)' }} />

        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #00c6d2, #542b9b)' }}>
              <Zap className="w-5 h-5" style={{ color: '#ffffff' }} />
            </div>

            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-black text-base" style={{ color: '#ffffff' }}>VybtPlus</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: 'linear-gradient(135deg, #00c6d2, #542b9b)', color: '#ffffff' }}>
                  PRO
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{t.unlockFullPotential}</p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-black text-lg" style={{ color: '#ffffff' }}>€4.99</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{t.perMonth}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {HIGHLIGHTS.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#00c6d2' }} />
                <span className="text-xs" style={{ color: '#d1d5db' }}>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 py-2.5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #00c6d2, #542b9b)' }}>
            <Zap className="w-4 h-4" style={{ color: '#ffffff' }} />
            <span className="font-bold text-sm" style={{ color: '#ffffff' }}>{t.tryVybtPlus}</span>
          </div>
        </div>
      </motion.button>

      <VybtPlusModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
    </>
  );
}
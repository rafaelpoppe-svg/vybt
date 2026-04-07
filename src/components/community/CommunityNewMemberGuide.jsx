import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, Camera, Users, ChevronRight } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

export default function CommunityNewMemberGuide({ communityId, onClose }) {
  const [step, setStep] = useState(0);
  const { t } = useLanguage();
  const storageKey = `community_guide_${communityId}`;

  const STEPS = [
    {
      icon: '🎉',
      title: t.guideStep1Title,
      desc: t.guideStep1Desc,
    },
    {
      icon: <CalendarDays className="w-8 h-8 text-blue-400" />,
      title: t.guideStep2Title,
      desc: t.guideStep2Desc,
    },
    {
      icon: <Camera className="w-8 h-8 text-purple-400" />,
      title: t.guideStep3Title,
      desc: t.guideStep3Desc,
    },
    {
      icon: <Users className="w-8 h-8 text-green-400" />,
      title: t.guideStep4Title,
      desc: t.guideStep4Desc,
    },
  ];

  const handleClose = () => {
    localStorage.setItem(storageKey, 'done');
    onClose();
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const current = STEPS[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-gray-900 rounded-t-3xl p-6 border-t border-white/10"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
      >
        {/* Close */}
        <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-gray-400">
          <X className="w-4 h-4" />
        </button>

        {/* Step dots */}
        <div className="flex gap-1.5 justify-center mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all"
              style={{ width: i === step ? 20 : 6, background: i === step ? '#00c6d2' : '#374151' }} />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="text-center mb-8"
          >
            <div className="text-5xl mb-4 flex items-center justify-center">
              {current.icon}
            </div>
            <h3 className="text-xl font-black text-white mb-2">{current.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{current.desc}</p>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)}
              className="px-5 py-3.5 rounded-2xl bg-gray-800 text-gray-300 font-bold text-sm">
              {t.guideBack}
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-black"
            style={{ background: 'linear-gradient(135deg, #00c6d2, #542b9b)' }}
          >
            {step < STEPS.length - 1 ? (
              <>{t.guideNext} <ChevronRight className="w-4 h-4" /></>
            ) : (
              t.guideLetsGo
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
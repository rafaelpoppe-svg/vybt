import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../common/LanguageContext';

export default function PlatformTutorial({ onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage();

  const tutorialSlides = [
    { title: t.tutorialSlide1Title, description: t.tutorialSlide1Desc, emoji: '🎉', gradient: 'from-[#00c6d2] to-green-500' },
    { title: t.tutorialSlide2Title, description: t.tutorialSlide2Desc, emoji: '🗺️', gradient: 'from-blue-400 to-cyan-500' },
    { title: t.tutorialSlide3Title, description: t.tutorialSlide3Desc, emoji: '👥', gradient: 'from-purple-400 to-pink-500' },
    { title: t.tutorialSlide4Title, description: t.tutorialSlide4Desc, emoji: '📸', gradient: 'from-orange-400 to-red-500' },
    { title: t.tutorialSlide5Title, description: t.tutorialSlide5Desc, emoji: '✨', gradient: 'from-yellow-400 to-orange-500' },
    { title: t.tutorialSlide6Title, description: t.tutorialSlide6Desc, emoji: '💬', gradient: 'from-pink-400 to-rose-500' },
    { title: t.tutorialSlide7Title, description: t.tutorialSlide7Desc, emoji: '🚀', gradient: 'from-[#00c6d2] to-[#542b9b]' },
  ];

  const goNext = () => {
    if (currentSlide < tutorialSlides.length - 1) setCurrentSlide(currentSlide + 1);
    else onClose();
  };

  const goBack = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const slide = tutorialSlides[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden"
      >
        <div className="absolute top-4 right-4 z-10">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors">
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        <div className="px-6 pt-16 pb-8 text-center min-h-96 flex flex-col justify-between">
          <div className="space-y-4">
            <motion.div key={currentSlide} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 200 }} className="text-6xl mb-6">
              {slide.emoji}
            </motion.div>
            <motion.h2 key={`title-${currentSlide}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} className="text-2xl font-bold text-white">
              {slide.title}
            </motion.h2>
            <motion.p key={`desc-${currentSlide}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} className="text-gray-400 text-base leading-relaxed">
              {slide.description}
            </motion.p>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {tutorialSlides.map((_, i) => (
              <motion.div key={i} onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full cursor-pointer transition-all ${i === currentSlide ? 'bg-[#00c6d2] w-6' : 'bg-gray-700 w-2'}`} />
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            <Button onClick={onClose} variant="outline"
              className="flex-1 border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800">
              {t.tutorialSkip}
            </Button>
            <Button onClick={goNext}
              className={`flex-1 bg-gradient-to-r ${slide.gradient} text-black font-semibold`}>
              {currentSlide === tutorialSlides.length - 1 ? t.tutorialStart : t.guideNext}
              {currentSlide < tutorialSlides.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
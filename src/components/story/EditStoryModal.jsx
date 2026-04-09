import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../common/LanguageContext';

export default function EditStoryModal({ isOpen, onClose, story, onSave, isLoading }) {
  const [caption, setCaption] = useState(story?.caption || '');
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="relative rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md mx-4 border border-gray-800"
          style={{background: 'var(--bg)'}}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-900 hover:bg-gray-800"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <h2 className="text-xl font-bold text-white mb-6">{t.editStoryCaption}</h2>

          <div className="space-y-4">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t.editStoryCaptionPlaceholder}
              className="bg-gray-900 border-gray-800 text-white min-h-32"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 text-right">{caption.length}/200</p>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-800 text-gray-400"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={() => onSave(caption)}
                disabled={isLoading}
                className="flex-1 bg-[#00fea3] text-[#0b0b0b] hover:bg-[#00fea3]/90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.save
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
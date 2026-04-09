import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../common/LanguageContext';

export default function DeletePlanModal({ isOpen, onClose, onConfirm, planTitle, isLoading, isLive = false }) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="relative bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isLive ? 'bg-orange-500/20' : 'bg-red-500/20'}`}>
              <AlertTriangle className={`w-8 h-8 ${isLive ? 'text-orange-500' : 'text-red-500'}`} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t.terminatePlanQuestion}</h2>
            <p className="text-gray-400 text-sm">"{planTitle}"</p>
            {isLive ? (
              <p className="text-orange-400 text-sm mt-3 font-medium">
                {t.deleteLiveWarning}
              </p>
            ) : (
              <p className="text-gray-500 text-xs mt-3">
                {t.terminatePlanVisibleDesc}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t.terminatePlanConfirm}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
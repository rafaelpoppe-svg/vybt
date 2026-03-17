import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, LogOut } from 'lucide-react';

export default function LeaveCommunityModal({ isOpen, onClose, onConfirm, communityName, isLoading }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full max-w-lg bg-gray-900 rounded-t-3xl p-6 border-t border-orange-500/30"
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">👋</div>
              <h3 className="text-xl font-black text-white">Sair da Community?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Tem a certeza que quer sair de <span className="text-orange-400 font-bold">{communityName}</span>?
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-gray-800 text-white font-bold"
              >
                Cancelar
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    Sair
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
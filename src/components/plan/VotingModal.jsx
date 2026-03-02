import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../common/LanguageContext';

export default function VotingModal({ isOpen, onClose, onVote, planTitle, isLoading }) {
  const [showLeaveQuestion, setShowLeaveQuestion] = useState(false);
  const [voteType, setVoteType] = useState(null);

  if (!isOpen) return null;

  const handleVote = (type) => {
    if (type === 'bad') {
      setVoteType(type);
      setShowLeaveQuestion(true);
    } else {
      onVote(type, false);
    }
  };

  const handleLeaveResponse = (wantsToLeave) => {
    onVote(voteType, wantsToLeave);
    setShowLeaveQuestion(false);
  };

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

          {!showLeaveQuestion ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Como foi o plano?</h2>
                <p className="text-gray-400 text-sm">"{planTitle}"</p>
                <p className="text-gray-500 text-xs mt-2">Sua opinião ajuda a melhorar eventos futuros</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleVote('great')}
                  disabled={isLoading}
                  className="w-full py-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg"
                >
                  <ThumbsUp className="w-6 h-6 mr-3" />
                  Great Plan! 🎉
                </Button>

                <Button
                  onClick={() => handleVote('bad')}
                  disabled={isLoading}
                  className="w-full py-6 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-lg"
                >
                  <ThumbsDown className="w-6 h-6 mr-3" />
                  Bad Plan 😔
                </Button>
              </div>

              <p className="text-xs text-gray-600 text-center mt-4">
                Votação encerra em 6 horas após o fim do plano
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Deseja sair deste plano?</h2>
                <p className="text-gray-400 text-sm">Você votou que não gostou do plano</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleLeaveResponse(true)}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  Sim, sair do plano
                </Button>

                <Button
                  onClick={() => handleLeaveResponse(false)}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold"
                >
                  Não, permanecer no grupo
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
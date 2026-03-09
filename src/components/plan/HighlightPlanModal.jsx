import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, TrendingUp, Eye, Info } from 'lucide-react';
import StripeCheckout from '../payment/StripeCheckout';
import { toast } from 'sonner';

export default function HighlightPlanModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  planTitle,
  planTags = [],
  isLoading = false 
}) {
  const [paid, setPaid] = useState(false);

  const handleSuccess = () => {
    setPaid(true);
    onConfirm();
    toast.success('Pagamento bem-sucedido! Plano em destaque 🔥');
    onClose();
  };

  const handleError = (msg) => {
    toast.error(msg || 'Erro no pagamento');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-bold text-white">Highlight Plan</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Plan Info */}
              <div className="p-4 rounded-xl bg-gray-800">
                <p className="text-white font-bold text-lg">{planTitle}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {planTags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-[#00c6d2]/20 text-[#00c6d2] text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                <p className="text-gray-400 text-sm font-medium">What you get:</p>
                
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/50">
                  <TrendingUp className="w-5 h-5 text-[#00c6d2] flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Appear First in Explore</p>
                    <p className="text-xs text-gray-400">Your plan will be shown at the top for users matching your tags</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/50">
                  <Eye className="w-5 h-5 text-[#542b9b] flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">More Visibility</p>
                    <p className="text-xs text-gray-400">Get discovered by more users interested in your party type</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/50">
                  <Flame className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Stand Out</p>
                    <p className="text-xs text-gray-400">Your plan will have a highlighted badge in the feed</p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  Your plan will appear first for users who have selected tags like "{planTags[0] || 'your party type'}".
                </p>
              </div>

              {/* Price */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Highlight Cost</p>
                    <p className="text-xs text-gray-400">One-time payment</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-400">€2.99</p>
                  </div>
                </div>
              </div>

              {/* Stripe Checkout */}
              <StripeCheckout
                type="highlight_plan"
                buttonLabel="Pay €2.99 & Highlight Plan"
                onSuccess={handleSuccess}
                onError={handleError}
              />

              <p className="text-xs text-gray-500 text-center">
                By highlighting, you agree to our terms of service
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
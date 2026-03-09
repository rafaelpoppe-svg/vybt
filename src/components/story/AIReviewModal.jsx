import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, AlertCircle, CheckCircle, X, Copy, Lightbulb, ArrowRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AIReviewModal({
  isOpen,
  onClose,
  review,
  caption,
  onApply,
  loading = false
}) {
  const [copiedSuggestion, setCopiedSuggestion] = useState(false);

  if (!isOpen || !review) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSuggestion(true);
    setTimeout(() => setCopiedSuggestion(false), 2000);
  };

  const hasImprovement = review.suggested_caption && review.suggested_caption !== caption;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 max-h-[80vh] overflow-y-auto"
          >
            <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-800 shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-[#542b9b]/20">
                    <Sparkles className="w-6 h-6 text-[#542b9b]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Review</h3>
                    <p className="text-xs text-gray-400">Smart suggestions for your caption</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>

              {/* Analysis Results */}
              <div className="space-y-4 mb-6">
                {/* Overall Assessment */}
                <div className={`p-4 rounded-xl border-2 ${
                  review.tone_appropriate 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}>
                  <div className="flex items-start gap-3">
                    {review.tone_appropriate ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${review.tone_appropriate ? 'text-green-300' : 'text-yellow-300'}`}>
                        {review.tone_appropriate ? 'Great tone!' : 'Tone could be improved'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {review.tone_feedback || 'Your caption has an appropriate tone for the community.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Quality */}
                {review.content_quality && (
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-[#00c6d2] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-white">Content Quality</p>
                        <p className="text-sm text-gray-400 mt-1">{review.content_quality}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Engagement Tips */}
                {review.engagement_tips && (
                  <div className="p-4 rounded-xl bg-[#00c6d2]/5 border border-[#00c6d2]/20">
                    <p className="font-medium text-[#00c6d2] mb-2">💡 Engagement Tip</p>
                    <p className="text-sm text-gray-300">{review.engagement_tips}</p>
                  </div>
                )}
              </div>

              {/* Suggested Caption */}
              {hasImprovement && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-white">Suggested Version</label>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyToClipboard(review.suggested_caption)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedSuggestion ? 'Copied!' : 'Copy'}
                    </motion.button>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#542b9b]/20 to-[#00c6d2]/10 border border-[#542b9b]/30">
                    <p className="text-white text-sm leading-relaxed">
                      {review.suggested_caption}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {hasImprovement && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onApply(review.suggested_caption)}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-[#542b9b] to-[#00c6d2] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#542b9b]/50 transition-all"
                  >
                    <ArrowRight className="w-5 h-5" />
                    Apply Suggestion
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="w-full py-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors"
                >
                  {hasImprovement ? 'Keep Original' : 'Got it'}
                </motion.button>
              </div>

              {/* Footer Note */}
              <p className="text-xs text-gray-500 text-center mt-4">
                AI suggestions are meant to improve engagement and community guidelines compliance.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
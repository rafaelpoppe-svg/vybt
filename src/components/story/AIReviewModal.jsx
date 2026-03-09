import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function AIReviewModal({ isOpen, onClose, review, caption, onApply }) {
  const [copied, setCopied] = useState(false);

  if (!review) return null;

  const handleCopy = () => {
    if (review.suggested_caption) {
      navigator.clipboard.writeText(review.suggested_caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
        >
          <motion.div
            initial={{ y: 400 }}
            animate={{ y: 0 }}
            exit={{ y: 400 }}
            className="w-full bg-gray-900 rounded-t-3xl border-t border-gray-800 max-h-[80vh] overflow-y-auto"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 flex items-center justify-between p-4 z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#542b9b]" />
                <h2 className="text-lg font-bold text-white">AI Review</h2>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Tone Analysis */}
              {review.tone && (
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                  <p className="text-sm font-medium text-gray-300 mb-2">Tone</p>
                  <p className="text-white">{review.tone}</p>
                </div>
              )}

              {/* Engagement Score */}
              {review.engagement_score !== undefined && (
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-300">Engagement Score</p>
                    <span className="text-lg font-bold text-[#00c6d2]">{review.engagement_score}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-[#00c6d2] h-2 rounded-full transition-all"
                      style={{ width: `${review.engagement_score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Feedback */}
              {review.feedback && (
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                  <p className="text-sm font-medium text-gray-300 mb-2">Feedback</p>
                  <p className="text-white text-sm leading-relaxed">{review.feedback}</p>
                </div>
              )}

              {/* Suggested Caption */}
              {review.suggested_caption && (
                <div className="p-4 rounded-xl bg-[#542b9b]/20 border border-[#542b9b]/50">
                  <p className="text-sm font-medium text-[#542b9b] mb-2">Suggested Caption</p>
                  <p className="text-white text-sm leading-relaxed mb-3">{review.suggested_caption}</p>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#542b9b]/30 border border-[#542b9b] text-[#542b9b] hover:bg-[#542b9b]/50 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onApply(review.suggested_caption)}
                      className="flex-1 py-2 rounded-lg bg-[#00c6d2] text-[#0b0b0b] font-semibold hover:bg-[#00c6d2]/90 transition-colors"
                    >
                      Apply
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
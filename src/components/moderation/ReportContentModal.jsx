import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '../common/LanguageContext';

export default function ReportContentModal({ isOpen, onClose, onReport, contentType = 'plan', contentTitle, isLoading }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const { t } = useLanguage();

  if (!isOpen) return null;

  const reportReasons = [
    t.reportReasonInappropriate,
    t.reportReasonSpam,
    t.reportReasonFalse,
    t.reportReasonViolent,
    t.reportReasonHarassment,
    t.reportReasonNudity,
    t.reportReasonOther,
  ];

  const handleSubmit = () => {
    if (selectedReason) {
      onReport({ reason: selectedReason, details });
      setSelectedReason('');
      setDetails('');
    }
  };

  const label = contentType === 'story' ? t.reportStory : t.reportPlan;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
          className="relative bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 max-h-[90vh] overflow-y-auto"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="mb-6">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{label}</h2>
            {contentTitle && <p className="text-gray-500 text-sm truncate">"{contentTitle}"</p>}
          </div>

          <div className="space-y-2 mb-4">
            {reportReasons.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`w-full p-3 rounded-xl text-left text-sm transition-all ${
                  selectedReason === reason
                    ? 'bg-red-500/20 border-2 border-red-500 text-white'
                    : 'bg-gray-800 border-2 border-transparent text-gray-400 hover:bg-gray-700'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">{t.reportAdditionalDetails}</label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t.reportDescribeProblem}
              className="bg-gray-800 border-gray-700 text-white min-h-20"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
              {t.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.report}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
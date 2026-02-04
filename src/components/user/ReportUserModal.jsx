import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const reportReasons = [
  'Comportamento inadequado',
  'Spam ou conteúdo irrelevante',
  'Assédio ou bullying',
  'Informações falsas',
  'Conteúdo ofensivo',
  'Outro'
];

export default function ReportUserModal({ isOpen, onClose, onReport, userName, isLoading }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedReason) {
      onReport({ reason: selectedReason, details });
    }
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
          className="relative bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="mb-6">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Reportar Usuário</h2>
            <p className="text-gray-400 text-sm">
              Reportar {userName}. Escolha o motivo:
            </p>
          </div>

          <div className="space-y-2 mb-4">
            {reportReasons.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
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
            <label className="block text-gray-400 text-sm mb-2">Detalhes (opcional)</label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Adicione mais informações..."
              className="bg-gray-800 border-gray-700 text-white min-h-20"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Reportar'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
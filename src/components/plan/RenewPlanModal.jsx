import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RenewPlanModal({ isOpen, onClose, onConfirm, plan, isLoading }) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    end_time: '',
    location_address: plan?.location_address || ''
  });

  if (!isOpen || !plan) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.date && formData.time && formData.end_time && formData.location_address) {
      onConfirm(formData);
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
            <h2 className="text-2xl font-bold text-white mb-2">Renovar Plano 🔄</h2>
            <p className="text-gray-400 text-sm">
              Todo será renovado com nova data e horário. As experience stories anteriores serão mantidas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Nova Data
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Horário de Início
              </label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Horário de Término
              </label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Novo Endereço
              </label>
              <Input
                type="text"
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                placeholder="Endereço completo"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#00fea3] text-[#0b0b0b] hover:bg-[#00fea3]/90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Confirmar Renovação'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
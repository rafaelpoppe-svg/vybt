import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '../common/LanguageContext';

export default function RenewPlanModal({ isOpen, onClose, onConfirm, onTerminate, plan, isLoading }) {
  const { t } = useLanguage();
  const [action, setAction] = useState(null); // 'renew' or 'terminate'
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

          {!action ? (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{t.adminActionsTitle}</h2>
                <p className="text-gray-400 text-sm">{t.chooseWhatToDo}</p>
              </div>

              <Button
                onClick={() => setAction('renew')}
                className="w-full py-6 rounded-xl bg-gradient-to-r from-[#00fea3] to-green-500 hover:from-[#00fea3]/90 hover:to-green-600 text-[#0b0b0b] font-semibold text-lg"
              >
                {t.renewPlanBtn}
              </Button>

              <Button
                onClick={() => setAction('terminate')}
                className="w-full py-6 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-lg"
              >
                {t.terminatePlanBtn}
              </Button>

              <Button
                variant="outline"
                onClick={onClose}
                className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                {t.cancel}
              </Button>
            </div>
          ) : action === 'terminate' ? (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{t.terminatePlanTitle}</h2>
                <p className="text-gray-400 text-sm">
                  {t.terminatePlanDesc}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm">
                  {t.terminateWarning}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAction(null)}
                  className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  {t.back}
                </Button>
                <Button
                  onClick={() => onTerminate()}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.confirmTermination}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{t.renewPlanTitle}</h2>
                <p className="text-gray-400 text-sm">
                  {t.renewPlanDesc}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                {t.newDate}
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
                {t.startTime}
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
                {t.endTime}
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
                {t.newAddress}
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
                    onClick={() => setAction(null)}
                    className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    Voltar
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
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
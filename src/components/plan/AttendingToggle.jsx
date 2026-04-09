import React from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../common/LanguageContext';

export default function AttendingToggle({ participation, planId, themeColor = '#00c6d2' }) {
  const queryClient = useQueryClient();
  const {t} = useLanguage();
  const statusMutation = useMutation({
    mutationFn: (newStatus) => base44.entities.PlanParticipant.update(participation.id, { status: newStatus }),
    onSuccess: () => queryClient.invalidateQueries(['planParticipants', planId]),
  });

  const isGoing = participation?.status === 'going' || !participation?.status;
  const isMaybe = participation?.status === 'maybe';

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-sm font-medium mr-1">{t.youAre}</span>
      <div className="flex rounded-full overflow-hidden border border-gray-700 bg-gray-900">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => !isGoing && statusMutation.mutate('going')}
          disabled={statusMutation.isPending}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all ${
            isGoing
              ? 'text-[#0b0b0b]'
              : 'text-gray-400 hover:text-white'
          }`}
          style={isGoing ? { background: themeColor } : {}}
        >
          {statusMutation.isPending && !isMaybe ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          {t.going}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => !isMaybe && statusMutation.mutate('maybe')}
          disabled={statusMutation.isPending}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all ${
            isMaybe
              ? 'bg-yellow-500/20 text-yellow-400 border-l border-yellow-500/30'
              : 'text-gray-400 hover:text-white border-l border-gray-700'
          }`}
        >
          {statusMutation.isPending && !isGoing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <HelpCircle className="w-3.5 h-3.5" />
          )}
          {t.maybe}
        </motion.button>
      </div>
    </div>
  );
}
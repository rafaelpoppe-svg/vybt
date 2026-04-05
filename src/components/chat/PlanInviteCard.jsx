import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, ChevronRight, Loader2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlanInviteCard({ planId }) {
  const navigate = useNavigate();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => base44.entities.PartyPlan.filter({ id: planId }).then(r => r[0]),
    enabled: !!planId,
    staleTime: 60000,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['planParticipants', planId],
    queryFn: () => base44.entities.PlanParticipant.filter({ plan_id: planId }),
    enabled: !!planId,
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="w-52 h-24 rounded-2xl bg-gray-800 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (!plan) return null;

  const accentColor = plan.theme_color || '#00c6d2';

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${planId}`)}
      className="w-56 rounded-2xl overflow-hidden border text-left"
      style={{ borderColor: `${accentColor}44`, background: `linear-gradient(135deg, ${accentColor}15, #1a1a2e)` }}
    >
      {/* Cover image */}
      <div className="relative w-full h-24 overflow-hidden">
        {plan.cover_image ? (
          <img src={plan.cover_image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl"
            style={{ background: `linear-gradient(135deg, ${accentColor}44, #542b9b44)` }}>
            🎉
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{plan.title}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" style={{ color: accentColor }} />
            <span className="text-xs truncate" style={{ color: accentColor }}>{plan.city}</span>
            <span className="text-xs text-gray-500">· {participants.length} {t.going}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </div>

      {/* CTA */}
      <div className="px-3 pb-3">
        <div
          className="w-full py-1.5 rounded-xl text-center text-xs font-bold"
          style={{ background: `${accentColor}25`, color: accentColor, border: `1px solid ${accentColor}44` }}
        >
          {t.viewGroup}
        </div>
      </div>
    </motion.button>
  );
}
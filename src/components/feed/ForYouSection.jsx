import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import PlanCard from './PlanCard';
import { useLanguage } from '../common/LanguageContext';

export default function ForYouSection({ plans, participants, profilesMap, onPlanClick, onSeeAll }) {
  const { t } = useLanguage();
  if (!plans || plans.length === 0) return null;

  const getParticipants = (planId) => {
    return participants
      .filter(p => p.plan_id === planId)
      .map(p => profilesMap[p.user_id])
      .filter(Boolean);
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#00c6d2]/20 to-[#542b9b]/20">
            <Sparkles className="w-5 h-5 text-[#00c6d2]" />
          </div>
          <h2 className="text-white font-bold text-lg">{t.forYou}</h2>
        </div>
        {onSeeAll && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onSeeAll}
            className="flex items-center gap-1 text-[#00c6d2] text-sm font-medium"
          >
            {t.seeAll}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {plans.slice(0, 5).map((plan) => (
          <div key={plan.id} className="min-w-[280px] max-w-[280px]">
            <PlanCard
              plan={plan}
              participants={getParticipants(plan.id)}
              featured={plan.matchScore > 70}
              onClick={() => onPlanClick(plan)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
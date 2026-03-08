import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProfilePlansCarousel({ plans, onPlanClick }) {
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <span className="text-4xl">🎉</span>
        <p className="text-gray-400 text-sm">Nenhum plano ainda</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
      {plans.map((plan, i) => (
        <motion.button
          key={plan.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onPlanClick(plan)}
          className="flex-shrink-0 w-72 rounded-2xl overflow-hidden bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-all"
        >
          {plan.cover_image && (
            <div className="relative h-32 overflow-hidden">
              <img
                src={plan.cover_image}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
          <div className="p-4 space-y-2">
            <h3 className="font-bold text-white text-left line-clamp-2">{plan.title}</h3>
            <div className="space-y-1.5 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>
                  {format(new Date(`${plan.date}T${plan.time}`), 'd MMM', { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{plan.city}</span>
              </div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
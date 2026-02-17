import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HappeningNowBanner({ plan }) {
  const navigate = useNavigate();

  if (!plan) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-3"
    >
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(createPageUrl('GroupChat') + `?planId=${plan.id}`)}
        className="w-full p-3 rounded-2xl flex items-center gap-3 text-left"
        style={{
          background: 'linear-gradient(135deg, rgba(255,100,0,0.25), rgba(84,43,155,0.25))',
          border: '1px solid rgba(255,100,0,0.4)'
        }}
      >
        <span className="text-2xl flex-shrink-0 animate-pulse">🔥</span>
        <div className="flex-1 min-w-0">
          <p className="text-orange-300 font-bold text-sm leading-tight">
            Seu plano está acontecendo agora!
          </p>
          <p className="text-gray-400 text-xs truncate mt-0.5">{plan.title}</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 flex-shrink-0">
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-orange-400 text-xs font-semibold">Live</span>
        </div>
      </motion.button>
    </motion.div>
  );
}
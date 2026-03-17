import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Trophy, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

export default function CommunityChallengeBanner({ challenge, tc, onTap }) {
  if (!challenge) return null;

  const isActive = challenge.status === 'active';
  const timeLeft = challenge.ends_at ? formatDistanceToNow(new Date(challenge.ends_at), { addSuffix: false }) : null;
  const ended = challenge.ends_at ? isPast(new Date(challenge.ends_at)) : false;

  const typeColors = {
    night: { bg: 'from-purple-900/80 to-indigo-900/80', border: 'border-purple-500/40', label: '🌙 Night Challenge' },
    day: { bg: 'from-orange-900/60 to-yellow-900/60', border: 'border-orange-500/40', label: '☀️ Day Challenge' },
    weekend: { bg: 'from-pink-900/60 to-rose-900/60', border: 'border-pink-500/40', label: '🎉 Weekend Challenge' },
    custom: { bg: 'from-gray-900/80 to-gray-800/80', border: 'border-gray-600/40', label: '⚡ Challenge' },
  };
  const style = typeColors[challenge.type] || typeColors.custom;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className={`w-full bg-gradient-to-r ${style.bg} border ${style.border} rounded-2xl p-4 text-left relative overflow-hidden`}
    >
      {/* Animated glow pulse for active */}
      {isActive && !ended && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* Emoji */}
        <div className="text-3xl flex-shrink-0">{challenge.emoji || '🔥'}</div>

        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{style.label}</p>

          {/* Title */}
          <h4 className="text-white font-black text-base leading-tight truncate">{challenge.title}</h4>

          {/* Description */}
          {challenge.description && (
            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{challenge.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {timeLeft && !ended && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400">
                <Clock className="w-3 h-3" />
                {timeLeft} left
              </span>
            )}
            {ended && (
              <span className="text-[10px] font-bold text-gray-500">Challenge ended</span>
            )}
            {challenge.submissions_count > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Flame className="w-3 h-3 text-orange-400" />
                {challenge.submissions_count} submissions
              </span>
            )}
            {challenge.prize_description && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-300">
                <Trophy className="w-3 h-3" />
                {challenge.prize_description}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}
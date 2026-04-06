import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Trophy, Flame, Users, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { useLanguage } from '../common/LanguageContext';

export default function CommunityChallengeBanner({ challenge, tc, onTap }) {
  const { t } = useLanguage();
  if (!challenge) return null;

  const ended = challenge.ends_at ? isPast(new Date(challenge.ends_at)) : false;
  const timeLeft = challenge.ends_at && !ended
    ? formatDistanceToNow(new Date(challenge.ends_at), { addSuffix: false })
    : null;

  const typeStyles = {
    night: {
      gradient: 'linear-gradient(135deg, #1a0a3e 0%, #2d1b69 50%, #0f0a1e 100%)',
      border: 'rgba(139,92,246,0.5)',
      accent: '#a78bfa',
      label: t.challengeNight,
    },
    day: {
      gradient: 'linear-gradient(135deg, #3d1a00 0%, #7c3d00 50%, #1a0d00 100%)',
      border: 'rgba(251,146,60,0.5)',
      accent: '#fb923c',
      label: t.challengeDay,
    },
    weekend: {
      gradient: 'linear-gradient(135deg, #3d0a2e 0%, #7c1a5c 50%, #1a0414 100%)',
      border: 'rgba(236,72,153,0.5)',
      accent: '#f472b6',
      label: t.challengeWeekend,
    },
    custom: {
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      border: 'rgba(148,163,184,0.3)',
      accent: tc,
      label: t.challengeCustom,
    },
  };

  const s = typeStyles[challenge.type] || typeStyles.custom;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onTap}
      className="w-full rounded-2xl overflow-hidden text-left relative"
      style={{ background: s.gradient, border: `1.5px solid ${s.border}` }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)` }} />

      {!ended && (
        <span className="absolute top-3.5 right-12 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: s.accent }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: s.accent }} />
        </span>
      )}

      <div className="p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          {challenge.emoji || '🔥'}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: s.accent }}>{s.label}</p>
          <h4 className="text-white font-black text-sm leading-tight truncate">{challenge.title}</h4>

          {challenge.description && (
            <p className="text-white/50 text-[11px] mt-0.5 line-clamp-1">{challenge.description}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {timeLeft && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400">
                <Clock className="w-3 h-3" />{timeLeft} {t.challengeTimeLeft}
              </span>
            )}
            {ended && <span className="text-[10px] font-bold text-gray-500">{t.challengeEnded}</span>}
            {challenge.submissions_count > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-white/40">
                <Flame className="w-3 h-3 text-orange-400" />{challenge.submissions_count} {t.stories}
              </span>
            )}
            {challenge.prize_description && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-300">
                <Trophy className="w-3 h-3" />{challenge.prize_description}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
      </div>

      {!ended && (
        <div className="px-4 pb-3">
          <div className="w-full py-2 rounded-xl text-center text-[11px] font-bold"
            style={{ background: `${s.accent}20`, color: s.accent }}>
            {t.challengeTapToParticipate}
          </div>
        </div>
      )}
    </motion.button>
  );
}
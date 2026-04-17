import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

export default function ChallengeRankingTop3({ scores, profilesMap, tc }) {
  const { t } = useLanguage();
  if (!scores || scores.length === 0) return null;
  const top3 = scores.slice(0, 3);
  const positions = [
    { position: 1, emoji: '🥇', color: 'from-yellow-600 to-yellow-700', light: 'rgba(250,204,21,0.15)', accent: '#faca15' },
    { position: 2, emoji: '🥈', color: 'from-gray-400 to-gray-500', light: 'rgba(156,163,175,0.15)', accent: '#9ca3af' },
    { position: 3, emoji: '🥉', color: 'from-orange-600 to-orange-700', light: 'rgba(234,88,12,0.15)', accent: '#ea580c' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs font-black uppercase tracking-wider text-gray-500 px-4">🏆 TOP 3 RANKING</p>
      
      <div className="grid grid-cols-3 gap-3 px-4">
        {top3.map((score, idx) => {
          const profile = profilesMap[score.user_id];
          const posData = positions[idx];

          return (
            <motion.div
              key={score.user_id}
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx * 0.08 }}
              className={`relative rounded-2xl p-4 text-center overflow-hidden border`}
              style={{
                background: `linear-gradient(135deg, ${posData.light}, transparent)`,
                borderColor: `${posData.accent}40`,
              }}
            >
              {/* Rank badge */}
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black"
                style={{ background: `linear-gradient(135deg, ${posData.color})`, color: 'white' }}>
                {posData.emoji}
              </div>

              {/* Avatar */}
              <div className="mb-2 flex justify-center">
                {profile?.photos?.[0]
                  ? <img src={profile.photos[0]} alt="" className="w-14 h-14 rounded-full object-cover border-3" style={{ borderColor: posData.accent }} />
                  : <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black" style={{ background: `${posData.accent}30`, color: posData.accent }}>
                      {profile?.display_name?.[0] || '?'}
                    </div>}
              </div>

              {/* Name */}
              <p className="font-black text-white text-xs truncate">{profile?.display_name || t.member}</p>

              {/* Points with icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
                className="flex items-center justify-center gap-1 mt-2"
              >
                <Zap className="w-4 h-4" style={{ color: posData.accent }} />
                <span className="font-black text-base" style={{ color: posData.accent }}>
                  {Math.round(score.total_points)}
                </span>
              </motion.div>

              {/* Breakdown */}
              <p className="text-[9px] text-gray-400 mt-1">{score.story_count} stories</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
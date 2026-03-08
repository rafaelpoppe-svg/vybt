import React from 'react';
import { motion } from 'framer-motion';
import { Music2, Sparkles } from 'lucide-react';
import VibeTag from '../common/VibeTag';
import PartyTag from '../common/PartyTag';

export default function ProfileAboutSection({ profile }) {
  return (
    <div className="space-y-6">
      {/* Bio */}
      {profile.bio && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/40 border border-gray-800/60 rounded-2xl px-4 py-4"
        >
          <p className="text-gray-300 text-sm leading-relaxed">{profile.bio}</p>
        </motion.div>
      )}

      {/* Vibes */}
      {profile.vibes?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Music2 className="w-4 h-4 text-[#00fea3]" />
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest">Meus Vibes</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.vibes.map((vibe, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <VibeTag vibe={vibe} size="lg" selected />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Party Types */}
      {profile.party_types?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#542b9b]" />
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest">Tipos de Festa</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.party_types.map((type, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <PartyTag tag={type} size="md" selected />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
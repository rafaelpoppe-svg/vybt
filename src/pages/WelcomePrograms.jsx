import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ChevronRight, X, ExternalLink, Star, Users, Zap, Trophy } from 'lucide-react';

const witnessPerks = [
  '🔄 Updates and features ideas',
  '💡 Ideas and suggestions',
  '💬 Feedbacks',
  '🎮 Discord Community',
  '🎬 Behind the scenes creation',
  '📊 Financial Reports transparency',
  '🧠 Build social think',
  '🗣️ Debate ideas',
  '📱 New Apps tendencies',
  '🔮 Vybt Insights',
  '🏅 Contributor Badge',
  '🗳️ Ideas debates and features votes',
];

const ambassadorPerks = [
  '🎮 Exclusive Discord Community',
  '🎬 Behind the scenes creation',
  '📱 New Apps tendencies',
  '🔮 Vybt Insights',
  '💸 Earn Money with Vybt',
  '✨ Free Plan & Story Highlights unlimited',
  '🏆 Ambassador Badge',
  '🧠 Build Social Think',
  '💬 Feedbacks',
  '📣 Access to marketing features & strategy',
];

export default function WelcomePrograms() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        setProfile(profiles[0]);
      } catch (e) {}
    };
    load();
  }, []);

  const handleSkip = async () => {
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, { programs_shown: true });
    }
    navigate(createPageUrl('Home'));
  };

  const handleWitness = () => {
    window.open('https://buymeacoffee.com/vybt', '_blank');
  };

  const handleAmbassador = async () => {
    if (profile?.id) {
      // Generate referral code if not exists
      const code = profile.referral_code || `VYBT${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await base44.entities.UserProfile.update(profile.id, {
        programs_shown: true,
        ambassador_opted_in: true,
        referral_code: code
      });
    }
    navigate(createPageUrl('Ambassador'));
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col overflow-y-auto">
      {/* Skip button */}
      <div className="flex justify-end p-5">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSkip}
          className="p-2 rounded-full bg-gray-900 border border-gray-800"
        >
          <X className="w-5 h-5 text-gray-400" />
        </motion.button>
      </div>

      {/* Header */}
      <div className="px-6 pb-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black bg-gradient-to-r from-[#00fea3] to-[#542b9b] bg-clip-text text-transparent mb-2"
        >
          Vybt
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Welcome to the community 🎉
        </motion.h1>
        <p className="text-gray-400 text-sm">Choose how you want to be part of Vybt's growth</p>
      </div>

      <div className="px-5 pb-10 space-y-5">

        {/* Witness Program Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-[#00fea3]/30 bg-gradient-to-br from-[#00fea3]/10 to-transparent overflow-hidden"
        >
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#00fea3]/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-[#00fea3]" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Vybt Witnesses Program</h2>
                <p className="text-[#00fea3] text-xs font-medium">Support & Shape Vybt</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5 mb-5">
              {witnessPerks.map((perk, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.03 }}
                  className="text-gray-300 text-sm"
                >
                  {perk}
                </motion.div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleWitness}
              className="w-full py-3.5 rounded-2xl bg-[#00fea3] text-[#0b0b0b] font-bold flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Join Witnesses Program
            </motion.button>
          </div>
        </motion.div>

        {/* Ambassador Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-3xl border border-[#542b9b]/50 bg-gradient-to-br from-[#542b9b]/20 to-transparent overflow-hidden"
        >
          <div className="p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-[#542b9b]/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Vybt Ambassador</h2>
                <p className="text-purple-400 text-xs font-medium">Invite 10+ friends & earn rewards</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 px-1">
              <Users className="w-4 h-4 text-purple-400" />
              <div className="flex-1 h-1.5 rounded-full bg-gray-800">
                <div className="h-full w-0 rounded-full bg-gradient-to-r from-[#542b9b] to-purple-400" />
              </div>
              <span className="text-purple-400 text-xs font-bold">0/10</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 mb-5">
              {ambassadorPerks.map((perk, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.03 }}
                  className="text-gray-300 text-sm"
                >
                  {perk}
                </motion.div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAmbassador}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#542b9b] to-purple-500 text-white font-bold flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Become an Ambassador
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSkip}
          className="w-full py-3 text-gray-500 text-sm"
        >
          Skip for now
        </motion.button>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  ChevronLeft, Copy, Check, Users, Trophy, Zap, Star, 
  Share2, CheckCircle2, Lock, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const ambassadorPerks = [
  { icon: '🎮', text: 'Exclusive Discord Community' },
  { icon: '🎬', text: 'Behind the scenes creation' },
  { icon: '📱', text: 'New Apps tendencies' },
  { icon: '🔮', text: 'Vybt Insights' },
  { icon: '💸', text: 'Earn Money with Vybt' },
  { icon: '✨', text: 'Free Plan & Story Highlights unlimited' },
  { icon: '🏆', text: 'Ambassador Badge' },
  { icon: '🧠', text: 'Build Social Think' },
  { icon: '💬', text: 'Feedbacks' },
  { icon: '📣', text: 'Access to marketing features & strategy' },
];

const steps = [
  { label: 'Join the program', done: true },
  { label: 'Get your referral link', done: true },
  { label: 'Invite 10 friends', count: true },
  { label: 'Unlock Ambassador status', final: true },
];

export default function Ambassador() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [referredUsers, setReferredUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        const p = profiles[0];

        // Generate referral code if missing
        if (p && !p.referral_code) {
          const code = `VYBT${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          await base44.entities.UserProfile.update(p.id, {
            referral_code: code,
            ambassador_opted_in: true
          });
          p.referral_code = code;
          p.ambassador_opted_in = true;
        }

        setProfile(p);

        // Fetch referred users
        if (p?.referral_code) {
          const refs = await base44.entities.UserProfile.filter({ referred_by: p.referral_code });
          setReferredUsers(refs);

          // Check if should become ambassador
          const count = refs.length;
          if (count >= 10 && !p.is_ambassador) {
            await base44.entities.UserProfile.update(p.id, {
              is_ambassador: true,
              referred_count: count
            });
            p.is_ambassador = true;
          } else if (count !== p.referred_count) {
            await base44.entities.UserProfile.update(p.id, { referred_count: count });
          }
        }
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/?ref=${profile.referral_code}`
    : '';

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      await navigator.share({
        title: 'Join me on Vybt!',
        text: '🎉 Join me on Vybt — the app for party plans and experiences!',
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  const inviteCount = referredUsers.length;
  const progress = Math.min((inviteCount / 10) * 100, 100);
  const isAmbassador = profile?.is_ambassador;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#542b9b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 px-5 py-4 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6 text-white" />
        </motion.button>
        <h1 className="text-white font-bold text-lg flex-1">Vybt Ambassador</h1>
        {isAmbassador && (
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#542b9b] to-purple-500 text-white text-xs font-bold">
            🏆 Ambassador
          </span>
        )}
      </div>

      <div className="px-5 py-6 space-y-6">

        {/* Hero */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#542b9b] to-purple-400 flex items-center justify-center mx-auto mb-4"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          {isAmbassador ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">You're an Ambassador! 🎉</h2>
              <p className="text-purple-400 text-sm">All perks are now unlocked. Thank you for growing Vybt!</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">Become a Vybt Ambassador</h2>
              <p className="text-gray-400 text-sm">Invite 10 friends and unlock exclusive rewards</p>
            </>
          )}
        </div>

        {/* Progress */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">Invites Progress</span>
            </div>
            <span className="text-purple-400 font-bold text-lg">{inviteCount}/10</span>
          </div>
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#542b9b] to-purple-400"
            />
          </div>
          {!isAmbassador && (
            <p className="text-gray-500 text-xs mt-2">{10 - inviteCount} more friends to go!</p>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest">Steps</h3>
          {steps.map((step, i) => {
            const isDone = step.done || (step.count && inviteCount >= 10) || (step.final && isAmbassador);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-[#00fea3]' : 'bg-gray-800 border border-gray-700'}`}>
                  {isDone
                    ? <Check className="w-3.5 h-3.5 text-[#0b0b0b]" />
                    : step.count
                    ? <span className="text-gray-400 text-[10px] font-bold">{inviteCount}</span>
                    : <Lock className="w-3 h-3 text-gray-600" />
                  }
                </div>
                <span className={`text-sm ${isDone ? 'text-white font-medium' : 'text-gray-500'}`}>
                  {step.count ? `${step.label} (${inviteCount}/10)` : step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Referral Link */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#00fea3]" />
            Your Referral Link
          </h3>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-800 rounded-xl px-3 py-2.5 text-gray-300 text-xs font-mono truncate">
              {referralLink || 'Generating...'}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-[#00fea3]/20 border border-[#00fea3]/40"
            >
              {copied ? <Check className="w-4 h-4 text-[#00fea3]" /> : <Copy className="w-4 h-4 text-[#00fea3]" />}
            </motion.button>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleShare}
            className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-[#542b9b] to-purple-500 text-white font-bold flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Invite Link
          </motion.button>
        </div>

        {/* Referred Users */}
        {referredUsers.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Friends You Invited ({referredUsers.length})
            </h3>
            <div className="space-y-2">
              {referredUsers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#542b9b] to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                    {u.display_name?.[0] || '?'}
                  </div>
                  <span className="text-gray-300 text-sm">{u.display_name || 'User'}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#00fea3] ml-auto" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perks */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Ambassador Benefits
          </h3>
          <div className="space-y-2.5">
            {ambassadorPerks.map((perk, i) => (
              <div key={i} className={`flex items-center gap-3 ${isAmbassador ? 'opacity-100' : i < 3 ? 'opacity-100' : 'opacity-50'}`}>
                <span className="text-lg">{perk.icon}</span>
                <span className="text-gray-300 text-sm">{perk.text}</span>
                {isAmbassador && <CheckCircle2 className="w-3.5 h-3.5 text-[#00fea3] ml-auto flex-shrink-0" />}
                {!isAmbassador && i >= 3 && <Lock className="w-3.5 h-3.5 text-gray-600 ml-auto flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
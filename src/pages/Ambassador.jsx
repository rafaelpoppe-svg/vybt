import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  ChevronLeft, Copy, Check, Users, Trophy, Star,
  Share2, CheckCircle2, Lock, ExternalLink, Zap
} from 'lucide-react';
import { toast } from 'sonner';

const DISCORD_LINK = 'https://discord.gg/nekE48rn';

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

// Level system: every 10 invites is a new milestone
function getLevel(count) {
  if (count < 10) return { level: 0, label: 'Newcomer', next: 10, color: 'from-gray-600 to-gray-400' };
  const lvl = Math.floor(count / 10);
  const labels = ['', 'Rising Star', 'Community Builder', 'City Legend', 'Vybt Icon', 'Elite Ambassador'];
  const colors = [
    '',
    'from-purple-600 to-purple-400',
    'from-blue-600 to-blue-400',
    'from-[#00c6d2] to-teal-400',
    'from-yellow-500 to-amber-400',
    'from-pink-500 to-rose-400',
  ];
  const capped = Math.min(lvl, 5);
  return {
    level: capped,
    label: labels[capped] || 'Elite Ambassador',
    next: (capped < 5) ? (capped + 1) * 10 : null,
    color: colors[capped] || colors[5],
  };
}

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

        if (p?.referral_code) {
          const refs = await base44.entities.UserProfile.filter({ referred_by: p.referral_code });
          setReferredUsers(refs);

          const count = refs.length;
          const shouldBeAmbassador = count >= 10;
          if (shouldBeAmbassador && !p.is_ambassador) {
            await base44.entities.UserProfile.update(p.id, { is_ambassador: true, referred_count: count });
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
  const isAmbassador = profile?.is_ambassador || inviteCount >= 10;
  const levelInfo = getLevel(inviteCount);
  const progressToNext = levelInfo.next
    ? Math.min(((inviteCount % 10) / 10) * 100, 100)
    : 100;

  // Milestones to display
  const milestones = [10, 20, 30, 40, 50];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#542b9b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-10"
      style={{background: 'var(--bg)'}}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-10 backdrop-blur-lg border-b border-gray-800 px-5 py-4 flex items-center gap-3"
        style={{background: 'var(--bg)', opacity: 0.95}}
      >
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6 text-white" />
        </motion.button>
        <h1 className="text-white font-bold text-lg flex-1">Vybt Ambassador</h1>
        {isAmbassador && (
          <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${levelInfo.color} text-white text-xs font-bold`}>
            🏆 {levelInfo.label}
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
            className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${levelInfo.color} flex items-center justify-center mx-auto mb-4`}
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          {isAmbassador ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">You're an Ambassador! 🎉</h2>
              <p className="text-purple-400 text-sm">Level {levelInfo.level} · {levelInfo.label} — Keep growing!</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">Become a Vybt Ambassador</h2>
              <p className="text-gray-400 text-sm">Invite 10 friends and unlock exclusive rewards</p>
            </>
          )}
        </div>

        {/* Level & Progress */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">Level {levelInfo.level} · {levelInfo.label}</span>
            </div>
            <span className="text-purple-400 font-bold text-lg">{inviteCount} invited</span>
          </div>
          {levelInfo.next && (
            <p className="text-gray-500 text-xs mb-3">{levelInfo.next - inviteCount} more to reach Level {levelInfo.level + 1}</p>
          )}
          {!levelInfo.next && (
            <p className="text-[#00c6d2] text-xs mb-3 font-semibold">🏆 Max level reached — You're a legend!</p>
          )}
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full bg-gradient-to-r ${levelInfo.color}`}
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest">Milestones</h3>
          <div className="grid grid-cols-5 gap-2">
            {milestones.map((m) => {
              const reached = inviteCount >= m;
              const levelIdx = Math.floor(m / 10);
              const colors = [
                'from-purple-600 to-purple-400',
                'from-blue-600 to-blue-400',
                'from-[#00c6d2] to-teal-400',
                'from-yellow-500 to-amber-400',
                'from-pink-500 to-rose-400',
              ];
              const color = colors[levelIdx - 1] || colors[0];
              return (
                <div key={m} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${reached ? `bg-gradient-to-br ${color} text-white` : 'bg-gray-800 text-gray-600 border border-gray-700'}`}>
                    {reached ? '✓' : m}
                  </div>
                  <span className={`text-[10px] text-center ${reached ? 'text-white' : 'text-gray-600'}`}>{m} inv.</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#00c6d2]" />
            Your Referral Link
          </h3>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-800 rounded-xl px-3 py-2.5 text-gray-300 text-xs font-mono truncate">
              {referralLink || 'Generating...'}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-[#00c6d2]/20 border border-[#00c6d2]/40"
            >
              {copied ? <Check className="w-4 h-4 text-[#00c6d2]" /> : <Copy className="w-4 h-4 text-[#00c6d2]" />}
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

        {/* Discord Community — unlocked at 10 invites */}
        <div className={`rounded-2xl p-5 border ${isAmbassador ? 'bg-[#5865F2]/10 border-[#5865F2]/40' : 'bg-gray-900 border-gray-800 opacity-60'}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎮</span>
            <div>
              <h3 className="text-white font-semibold">Exclusive Discord Community</h3>
              <p className="text-gray-400 text-xs">
                {isAmbassador ? 'You have access — join your crew!' : 'Unlocked at 10 invites'}
              </p>
            </div>
            {!isAmbassador && <Lock className="w-4 h-4 text-gray-600 ml-auto flex-shrink-0" />}
          </div>
          {isAmbassador ? (
            <motion.a
              href={DISCORD_LINK}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              className="w-full py-3 rounded-2xl bg-[#5865F2] text-white font-bold flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Join the Discord
            </motion.a>
          ) : (
            <div className="w-full py-3 rounded-2xl bg-gray-800 text-gray-500 font-bold flex items-center justify-center gap-2 text-sm">
              <Lock className="w-4 h-4" />
              Invite {10 - inviteCount} more friends to unlock
            </div>
          )}
        </div>

        {/* Referred Users */}
        {referredUsers.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Friends You Invited ({referredUsers.length})
            </h3>
            <div className="space-y-2">
              {referredUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#542b9b] to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                    {u.display_name?.[0] || '?'}
                  </div>
                  <span className="text-gray-300 text-sm">{u.display_name || 'User'}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#00c6d2] ml-auto" />
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
                {isAmbassador && <CheckCircle2 className="w-3.5 h-3.5 text-[#00c6d2] ml-auto flex-shrink-0" />}
                {!isAmbassador && i >= 3 && <Lock className="w-3.5 h-3.5 text-gray-600 ml-auto flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
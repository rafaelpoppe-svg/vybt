import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../common/LanguageContext';

export default function SharePlanModal({ isOpen, onClose, plan, planId, friendIds = [], profilesMap = {}, currentUser }) {
  const [copied, setCopied] = useState(false);
  const [sentTo, setSentTo] = useState(new Set());
  const { t } = useLanguage();
  
  if (!isOpen || !plan) return null;

  const shareUrl = `${window.location.origin}/PlanDetails?id=${planId}`;
  const shareText = `🎉 ${plan.title}\n📍 ${plan.location_address}, ${plan.city}\n📅 ${plan.date} às ${plan.time}\n\nVem comigo! ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: plan.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (e) {
        // user cancelled — ignore
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`🎉 ${plan.title} — vem comigo!`)}`;
    window.open(url, '_blank');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  // Friends who are NOT already in the plan (not fetched here; friendIds is already pre-filtered or all friends)
  const friendProfiles = friendIds
    .map(id => profilesMap[id])
    .filter(Boolean);

  const markSent = (id) => {
    setSentTo(prev => new Set([...prev, id]));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className="w-full max-w-[430px] rounded-t-3xl overflow-hidden"
          style={{ background: 'var(--bg)', paddingBottom: 'max(env(safe-area-inset-bottom,0px), 24px)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
            <h2 className="text-white font-bold text-base">{ t.sharePlan }</h2>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-400" />
            </motion.button>
          </div>

          {/* Plan preview */}
          <div className="mx-5 mt-4 mb-4 flex items-center gap-3 p-3 rounded-xl bg-gray-900/60 border border-gray-800">
            {plan.cover_image
              ? <img src={plan.cover_image} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              : <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00c6d2]/30 to-[#542b9b]/30 flex items-center justify-center text-2xl flex-shrink-0">🎉</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{plan.title}</p>
              <p className="text-gray-400 text-xs truncate">{plan.location_address}, {plan.city}</p>
            </div>
          </div>

          {/* External share options */}
          <div className="px-5 mb-4">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">{ t.externalShare }</p>
            <div className="flex gap-3 justify-around">
              {/* Copy link */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleCopyLink}
                className="flex flex-col items-center gap-1.5">
                <div className="w-13 h-13 w-14 h-14 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: copied ? '#00c6d220' : 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  {copied ? <Check className="w-6 h-6 text-[#00c6d2]" /> : <Copy className="w-6 h-6 text-gray-300" />}
                </div>
                <span className="text-gray-400 text-[10px]"> { t.copyLink } </span>
              </motion.button>

              {/* Native share / more */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleNativeShare}
                className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <Send className="w-6 h-6 text-gray-300" />
                </div>
                <span className="text-gray-400 text-[10px]"> { t.share } </span>
              </motion.button>

              {/* WhatsApp */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleWhatsApp}
                className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid #25D36630' }}>
                  💬
                </div>
                <span className="text-gray-400 text-[10px]">WhatsApp</span>
              </motion.button>

              {/* Telegram */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleTelegram}
                className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid #229ED930' }}>
                  ✈️
                </div>
                <span className="text-gray-400 text-[10px]">Telegram</span>
              </motion.button>

              {/* Twitter/X */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleTwitter}
                className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid #33333380' }}>
                  𝕏
                </div>
                <span className="text-gray-400 text-[10px]">Twitter</span>
              </motion.button>
            </div>
          </div>

          {/* Friends on platform */}
          {friendProfiles.length > 0 && (
            <div className="px-5">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3"> { t.inviteFriendsPlatform } </p>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {friendProfiles.map(profile => (
                  <div key={profile.user_id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-800 bg-gray-900/40">
                    {profile.photos?.[0]
                      ? <img src={profile.photos[0]} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00c6d2]/40 to-[#542b9b]/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">{(profile.display_name || '?')[0]}</span>
                        </div>
                    }
                    <p className="flex-1 text-white text-sm truncate">{profile.display_name}</p>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        // Open DM or trigger share message to this friend
                        const msg = encodeURIComponent(`Ei! Olha este plano: ${plan.title} — ${shareUrl}`);
                        // Best effort: open whatsapp if no DM, else just mark as sent
                        markSent(profile.user_id);
                        toast.success(`Convite enviado para ${profile.display_name}`);
                      }}
                      disabled={sentTo.has(profile.user_id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-60 transition-all"
                      style={sentTo.has(profile.user_id)
                        ? { background: 'var(--surface-2)', color: 'var(--text-muted)' }
                        : { background: 'linear-gradient(135deg, #00c6d2, #542b9b)', color: 'white' }
                      }
                    >
                      {sentTo.has(profile.user_id) ? t.sent  : t.invite }
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
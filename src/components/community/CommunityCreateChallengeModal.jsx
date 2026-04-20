import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Trophy, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../common/LanguageContext';

export default function CommunityCreateChallengeModal({ communityId, plans, onClose, tc }) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const TYPES = [
    { key: 'night', label: '🌙 ' + t.challengeTypeNight, desc: t.challengeTypeNightDesc },
    { key: 'day', label: '☀️ ' + t.challengeTypeDay, desc: t.challengeTypeDayDesc },
    { key: 'weekend', label: '🎉 ' + t.challengeTypeWeekend, desc: t.challengeTypeWeekendDesc },
    { key: 'custom', label: '⚡ ' + t.challengeTypeCustom, desc: t.challengeTypeCustomDesc },
  ];

  const DURATIONS = [
    { label: '12h', hours: 12 },
    { label: '24h', hours: 24 },
    { label: '48h', hours: 48 },
    { label: t.challengeDurationWeek, hours: 168 },
  ];

  const EMOJIS = ['🔥', '🏆', '📸', '🎉', '🌙', '☀️', '💃', '🕺', '🎶', '🍾'];

  const [form, setForm] = useState({
    title: '',
    description: '',
    emoji: '🔥',
    type: 'night',
    duration_hours: 24,
    prize_description: '',
    plan_id: '',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const ends_at = new Date(now.getTime() + form.duration_hours * 3600 * 1000).toISOString();
      await base44.entities.CommunityChallenge.create({
        community_id: communityId,
        title: form.title,
        description: form.description,
        emoji: form.emoji,
        type: form.type,
        starts_at: now.toISOString(),
        ends_at,
        status: 'active',
        prize_description: form.prize_description || undefined,
        plan_id: form.plan_id || undefined,
        submissions_count: 0,
      });
      const members = await base44.entities.CommunityMember.filter({ community_id: communityId });
      await Promise.all(members.map(m =>
        base44.entities.Notification.create({
          user_id: m.user_id,
          type: 'challenge_launched',
          title: `${form.emoji} ${t.challengeNewNotifTitle}: ${form.title}`,
          message: form.description || t.challengeNewNotifMessage,
          plan_id: communityId, // reuse plan_id to carry community_id for navigation
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityChallenge', communityId]);
      onClose();
    },
  });

  const canSubmit = form.title.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-gray-950 rounded-t-3xl border-t border-white/10 overflow-y-auto"
        style={{ maxHeight: '90dvh', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 sticky top-0 bg-gray-950 z-10">
          <div>
            <h3 className="text-white font-black text-lg">{t.createChallenge}</h3>
            <p className="text-gray-500 text-xs">{t.createChallengeSubtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 space-y-5 pb-2">
          {/* Emoji picker */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">{t.challengePickEmoji}</p>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <motion.button
                  key={e} whileTap={{ scale: 0.85 }}
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
                  style={form.emoji === e
                    ? { background: `${tc}30`, borderColor: tc }
                    : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  {e}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">{t.challengeType}</p>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(type => (
                <motion.button
                  key={type.key} whileTap={{ scale: 0.97 }}
                  onClick={() => setForm(f => ({ ...f, type: type.key }))}
                  className="p-3 rounded-2xl border text-left transition-all"
                  style={form.type === type.key
                    ? { background: `${tc}20`, borderColor: `${tc}60` }
                    : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <p className="text-sm font-bold text-white">{type.label}</p>
                  <p className="text-[10px] text-gray-500">{type.desc}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">{t.challengeTitle}</p>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={t.challengeTitlePlaceholder}
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-gray-600"
            />
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">
              {t.challengeDescription} <span className="text-gray-700 normal-case font-normal">({t.optional})</span>
            </p>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={t.challengeDescriptionPlaceholder}
              rows={2}
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-gray-600 resize-none"
            />
          </div>

          {/* Duration */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">{t.challengeDuration}</p>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <motion.button
                  key={d.label} whileTap={{ scale: 0.93 }}
                  onClick={() => setForm(f => ({ ...f, duration_hours: d.hours }))}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all"
                  style={form.duration_hours === d.hours
                    ? { background: `${tc}25`, borderColor: `${tc}60`, color: tc }
                    : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#6b7280' }}
                >
                  {d.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Prize */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">
              {t.challengePrize} <span className="text-gray-700 normal-case font-normal">({t.optional})</span>
            </p>
            <input
              value={form.prize_description}
              onChange={e => setForm(f => ({ ...f, prize_description: e.target.value }))}
              placeholder={t.challengePrizePlaceholder}
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-gray-600"
            />
          </div>

          {/* Link to plan */}
          {plans.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">
                {t.challengeLinkPlan} <span className="text-gray-700 normal-case font-normal">({t.optional})</span>
              </p>
              <select
                value={form.plan_id}
                onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm outline-none"
              >
                <option value="">{t.challengeNoSpecificPlan}</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-5 pt-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
            className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40 flex items-center justify-center gap-2 text-black"
            style={{ background: canSubmit ? `linear-gradient(135deg, ${tc}, #542b9b)` : '#374151', color: 'white' }}
          >
            {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>🚀 {t.challengeLaunch}</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
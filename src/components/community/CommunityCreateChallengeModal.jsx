import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Trophy, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const TYPES = [
  { key: 'night', label: '🌙 Night', desc: 'Best night out story' },
  { key: 'day', label: '☀️ Day', desc: 'Best daytime story' },
  { key: 'weekend', label: '🎉 Weekend', desc: 'Weekend vibes' },
  { key: 'custom', label: '⚡ Custom', desc: 'Your own theme' },
];

const DURATIONS = [
  { label: '12h', hours: 12 },
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '1 week', hours: 168 },
];

const EMOJIS = ['🔥', '🏆', '📸', '🎉', '🌙', '☀️', '💃', '🕺', '🎶', '🍾'];

export default function CommunityCreateChallengeModal({ communityId, plans, onClose, tc }) {
  const queryClient = useQueryClient();
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
            <h3 className="text-white font-black text-lg">Create Challenge</h3>
            <p className="text-gray-500 text-xs">Announce a story challenge to the community</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 space-y-5 pb-2">
          {/* Emoji picker */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Pick an emoji</p>
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
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Type</p>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => (
                <motion.button
                  key={t.key} whileTap={{ scale: 0.97 }}
                  onClick={() => setForm(f => ({ ...f, type: t.key }))}
                  className="p-3 rounded-2xl border text-left transition-all"
                  style={form.type === t.key
                    ? { background: `${tc}20`, borderColor: `${tc}60` }
                    : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <p className="text-sm font-bold text-white">{t.label}</p>
                  <p className="text-[10px] text-gray-500">{t.desc}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Title</p>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Best Sunset Shot Tonight 🌅"
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-gray-600"
            />
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Description <span className="text-gray-700 normal-case font-normal">(optional)</span></p>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Tell members what kind of stories you want to see..."
              rows={2}
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-gray-600 resize-none"
            />
          </div>

          {/* Duration */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Duration</p>
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
            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Prize / Reward <span className="text-gray-700 normal-case font-normal">(optional)</span></p>
            <input
              value={form.prize_description}
              onChange={e => setForm(f => ({ ...f, prize_description: e.target.value }))}
              placeholder="e.g. Featured on the community page 🏆"
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-gray-600"
            />
          </div>

          {/* Link to plan */}
          {plans.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Link to Plan <span className="text-gray-700 normal-case font-normal">(optional)</span></p>
              <select
                value={form.plan_id}
                onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm outline-none"
              >
                <option value="">No specific plan</option>
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
            {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>🚀 Launch Challenge</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
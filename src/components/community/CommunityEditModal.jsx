import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Image as ImageIcon, Loader2, Check, Lock, Unlock, Trash2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '../common/LanguageContext';

const THEME_COLORS = [
  '#00c6d2','#542b9b','#ff6b6b','#f8b500','#ff69b4',
  '#22c55e','#f97316','#3b82f6','#e879f9','#84cc16',
  '#ef4444','#a78bfa','#06b6d4','#fb923c','#ec4899',
];

export default function CommunityEditModal({ community, onClose, onSaved, onDelete }) {
  const [data, setData] = useState({
    name: community.name || '',
    description: community.description || '',
    theme_color: community.theme_color || '#00c6d2',
    cover_image: community.cover_image || '',
    background_image: community.background_image || '',
    chat_locked: community.chat_locked || false,
    plan_creation_policy: community.plan_creation_policy || 'anyone',
    is_private: community.is_private || false,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const { t } = useLanguage();
  const tc = data.theme_color;

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (field === 'cover_image') setUploadingCover(true);
    else setUploadingBg(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setData(prev => ({ ...prev, [field]: file_url }));
    if (field === 'cover_image') setUploadingCover(false);
    else setUploadingBg(false);
  };

  const handleSave = async () => {
    setLoading(true);
    await base44.entities.Community.update(community.id, data);
    setLoading(false);
    onSaved();
  };

  const PLAN_POLICIES = [
    { key: 'anyone', emoji: '🌍', title: t.policyAnyone },
    { key: 'approval_required', emoji: '✅', title: t.policyApproval },
    { key: 'admins_only', emoji: '👑', title: t.policyAdminsOnly },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="w-full max-w-lg bg-gray-900 rounded-t-3xl border-t border-gray-800 overflow-y-auto"
        style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-black text-white">{t.editCommunity} ✏️</h2>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        <div className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">{t.communityName}</label>
            <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">{t.challengeDescription}</label>
            <Textarea value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white min-h-20" />
          </div>

          {/* Theme Color */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">{t.communityThemeColor}</label>
            <div className="flex gap-2 flex-wrap">
              {THEME_COLORS.map((color) => (
                <motion.button key={color} whileTap={{ scale: 0.85 }} onClick={() => setData({ ...data, theme_color: color })}
                  className="relative w-8 h-8 rounded-lg" style={{ backgroundColor: color }}>
                  {data.theme_color === color && <div className="absolute inset-0 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-[#0b0b0b]" /></div>}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">{t.communityCoverImage}</label>
            <label className="block cursor-pointer">
              {data.cover_image
                ? <div className="relative h-32 rounded-xl overflow-hidden">
                    <img src={data.cover_image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white text-sm">{t.communityChangePhoto} 📸</span></div>
                  </div>
                : <div className="h-32 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center gap-2">
                    {uploadingCover ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: tc }} /> : <><ImageIcon className="w-6 h-6 text-gray-600" /><span className="text-gray-500 text-sm">{t.communityCoverPhoto}</span></>}
                  </div>}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover_image')} className="hidden" />
            </label>
          </div>

          {/* Background */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">{t.communityBackgroundImage}</label>
            <label className="block cursor-pointer">
              {data.background_image
                ? <div className="relative h-20 rounded-xl overflow-hidden">
                    <img src={data.background_image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white text-sm">{t.communityChangePhoto}</span></div>
                  </div>
                : <div className="h-20 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center gap-2">
                    {uploadingBg ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: tc }} /> : <><ImageIcon className="w-5 h-5 text-gray-600" /><span className="text-gray-500 text-xs">{t.communityBackgroundTexture}</span></>}
                  </div>}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'background_image')} className="hidden" />
            </label>
          </div>

          {/* Private community */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-800 border border-gray-700">
            <div className="flex items-center gap-3">
              {data.is_private ? <EyeOff className="w-5 h-5 text-purple-400" /> : <Eye className="w-5 h-5 text-blue-400" />}
              <div>
                <p className="text-white font-semibold text-sm">{t.communityVisibility}</p>
                <p className="text-gray-400 text-xs">{data.is_private ? t.communityPrivateDesc : t.communityPublicDesc}</p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setData({ ...data, is_private: !data.is_private })}
              className="w-12 h-6 rounded-full transition-all relative" style={{ background: data.is_private ? tc : '#374151' }}>
              <motion.div animate={{ x: data.is_private ? 24 : 2 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow" />
            </motion.button>
          </div>

          {/* Chat lock */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-800 border border-gray-700">
            <div className="flex items-center gap-3">
              {data.chat_locked ? <Lock className="w-5 h-5 text-orange-400" /> : <Unlock className="w-5 h-5 text-green-400" />}
              <div>
                <p className="text-white font-semibold text-sm">{t.communityChatAccess}</p>
                <p className="text-gray-400 text-xs">{data.chat_locked ? t.membersOnly : t.communityOpenToAll}</p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setData({ ...data, chat_locked: !data.chat_locked })}
              className="w-12 h-6 rounded-full transition-all relative" style={{ background: data.chat_locked ? tc : '#374151' }}>
              <motion.div animate={{ x: data.chat_locked ? 24 : 2 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow" />
            </motion.button>
          </div>

          {/* Plan policy */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">{t.communityPlanPolicy}</label>
            {PLAN_POLICIES.map((opt) => (
              <motion.button key={opt.key} whileTap={{ scale: 0.97 }} onClick={() => setData({ ...data, plan_creation_policy: opt.key })}
                className="w-full p-3 rounded-xl border mb-2 text-left flex items-center gap-2 transition-all"
                style={data.plan_creation_policy === opt.key ? { borderColor: tc, background: `${tc}18` } : { borderColor: 'var(--bg-secondary)', background: 'var(--bg)' }}>
                <span>{opt.emoji}</span>
                <span className="text-white text-sm font-medium">{opt.title}</span>
                {data.plan_creation_policy === opt.key && <Check className="w-4 h-4 ml-auto" style={{ color: tc }} />}
              </motion.button>
            ))}
          </div>

          {/* Save */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={loading}
            className="w-full py-4 rounded-2xl font-black text-lg text-[#0b0b0b] flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${tc}, #542b9b)` }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${t.saveChanges} ✅`}
          </motion.button>

          {/* Delete community */}
          {onDelete && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { onClose(); onDelete(); }}
              className="w-full py-3 rounded-2xl font-bold text-sm text-red-400 flex items-center justify-center gap-2 border border-red-500/20 bg-red-500/5">
              <Trash2 className="w-4 h-4" /> {t.deleteCommunity}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
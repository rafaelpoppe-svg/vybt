import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Image as ImageIcon, Loader2, Check, ArrowRight, Palette, Lock, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PartyTag, { ALL_PARTY_TYPES } from '../components/common/PartyTag';

const THEME_COLORS = [
  '#00c6d2','#542b9b','#ff6b6b','#f8b500','#ff69b4',
  '#22c55e','#f97316','#3b82f6','#e879f9','#84cc16',
  '#ef4444','#a78bfa','#06b6d4','#fb923c','#ec4899',
];

const STEPS = [
  { id: 1, label: 'Identity', emoji: '✨' },
  { id: 2, label: 'Location', emoji: '📍' },
  { id: 3, label: 'Vibe', emoji: '🎉' },
  { id: 4, label: 'Settings', emoji: '⚙️' },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

export default function CreateCommunity() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [createdCommunity, setCreatedCommunity] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [data, setData] = useState({
    name: '', description: '', city: '', theme_color: '#00c6d2',
    cover_image: '', background_image: '', party_types: [], vibes: [],
    plan_creation_policy: 'anyone',
  });

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => navigate(createPageUrl('Home')));
  }, []);

  const isAdmin = currentUser?.role === 'admin';

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

  const goNext = () => { setDirection(1); setStep(s => s + 1); };
  const goBack = () => {
    if (step === 1) { navigate(-1); return; }
    setDirection(-1); setStep(s => s - 1);
  };

  const canProceed = () => {
    if (step === 1) return !!data.name && !!data.cover_image;
    if (step === 2) return !!data.city;
    if (step === 3) return data.party_types.length >= 1;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const community = await base44.entities.Community.create({
      ...data,
      creator_id: currentUser.id,
      member_count: 1,
    });
    await base44.entities.CommunityMember.create({
      community_id: community.id,
      user_id: currentUser.id,
      role: 'admin',
      joined_at: new Date().toISOString(),
    });
    setCreatedCommunity(community);
    setLoading(false);
    setDone(true);
  };

  // ── SUCCESS SCREEN ─────────────────────────────────────────────────────────
  if (done && createdCommunity) {
    const tc = createdCommunity.theme_color || '#00c6d2';
    const lightnings = ['⚡','⚡','⚡','⚡','⚡','⚡'];
    return (
      <div className="fixed inset-0 bg-[#0b0b0b] flex flex-col items-center justify-center overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
        {/* Blue lightning rays */}
        {lightnings.map((_, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, scale: 0, rotate: (i * 60), x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 3, 0], x: Math.cos((i * 60 * Math.PI) / 180) * 200, y: Math.sin((i * 60 * Math.PI) / 180) * 200 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 1.2, ease: 'easeOut' }}
            className="fixed text-5xl pointer-events-none z-0 text-[#00c6d2]"
            style={{ filter: 'drop-shadow(0 0 20px #00c6d2)' }}
          >⚡</motion.div>
        ))}

        {/* Confetti emojis */}
        {['🎉','🔥','🎊','✨','💫','🥂','🕺','💃','🎶','🌟'].map((emoji, i) => (
          <motion.div key={`e${i}`}
            initial={{ y: '100vh', x: `${(i * 11) % 90}vw`, opacity: 0, rotate: 0 }}
            animate={{ y: '-20vh', opacity: [0, 1, 1, 0], rotate: 360 }}
            transition={{ delay: i * 0.12, duration: 2.8, ease: 'easeOut' }}
            className="fixed text-3xl pointer-events-none z-0"
            style={{ left: `${(i * 11) % 90}%` }}
          >{emoji}</motion.div>
        ))}

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.4 }}
          className="relative z-10 w-full max-w-sm px-6 text-center"
        >
          {/* Community preview card */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="rounded-3xl overflow-hidden border mb-8"
            style={{ borderColor: `${tc}40`, boxShadow: `0 0 40px ${tc}40` }}
          >
            {createdCommunity.cover_image
              ? <img src={createdCommunity.cover_image} alt="" className="w-full h-40 object-cover" />
              : <div className="h-40 flex items-center justify-center text-6xl" style={{ background: `linear-gradient(135deg, ${tc}44, #542b9b44)` }}>⭐</div>}
            <div className="p-4" style={{ background: `linear-gradient(135deg, ${tc}22, #0b0b0b)` }}>
              <p className="text-white font-black text-xl">{createdCommunity.name}</p>
              <p className="text-gray-400 text-sm mt-1">{createdCommunity.city}</p>
            </div>
          </motion.div>

          <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-4xl font-black text-white mb-3">Let's fire this!! 🔥</motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}
            className="text-lg font-bold mb-8" style={{ color: tc }}>
            Your community is live! ⚡
          </motion.p>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="space-y-3">
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => navigate(createPageUrl('CommunityView') + `?id=${createdCommunity.id}`)}
              className="w-full py-4 rounded-2xl font-black text-lg text-[#0b0b0b]"
              style={{ background: `linear-gradient(135deg, ${tc}, #542b9b)` }}>
              Go to my Community 🚀
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(createPageUrl('Home'))}
              className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold border border-gray-800">
              Go to Home 🏠
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const stepContent = {
    1: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">⭐</div>
          <h2 className="text-2xl font-black text-white">Name your Community</h2>
          <p className="text-gray-400 mt-1">Give it a vibe! 🔥</p>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-2">Community Name *</label>
          <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="e.g. Erasmus Braga 🎓" className="bg-gray-900 border-gray-800 text-white text-lg py-6" autoFocus />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-2">Description <span className="text-gray-600">(optional)</span></label>
          <Textarea value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })}
            placeholder="What is this community about? 🎉" className="bg-gray-900 border-gray-800 text-white min-h-20" />
        </div>
        {/* Theme Color */}
        <div>
          <label className="block text-gray-400 text-sm mb-3 flex items-center gap-1.5"><Palette className="w-4 h-4" />Theme Color</label>
          <div className="flex gap-2 flex-wrap">
            {THEME_COLORS.map((color) => (
              <motion.button key={color} whileTap={{ scale: 0.85 }} onClick={() => setData({ ...data, theme_color: color })}
                className="relative w-9 h-9 rounded-xl" style={{ backgroundColor: color }}>
                {data.theme_color === color && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#0b0b0b]" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
          {/* Live preview dot */}
          <div className="mt-3 h-1.5 w-full rounded-full" style={{ background: `linear-gradient(90deg, ${data.theme_color}, #542b9b)` }} />
        </div>
        {/* Cover Image */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Cover Image <span className="text-red-500">*</span></label>
          <label className="block cursor-pointer">
            {data.cover_image
              ? <div className="relative h-40 rounded-2xl overflow-hidden">
                  <img src={data.cover_image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">Change 📸</span>
                  </div>
                </div>
              : <div className="h-40 rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-gray-500 transition-colors">
                  {uploadingCover ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: data.theme_color }} /> : <><ImageIcon className="w-8 h-8 text-gray-600" /><span className="text-gray-500 text-sm">Add cover photo 🌆</span></>}
                </div>}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover_image')} className="hidden" />
          </label>
        </div>
        {/* Background Image */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Background Image <span className="text-gray-600">(optional)</span></label>
          <label className="block cursor-pointer">
            {data.background_image
              ? <div className="relative h-24 rounded-2xl overflow-hidden">
                  <img src={data.background_image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">Change</span>
                  </div>
                </div>
              : <div className="h-24 rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-gray-500 transition-colors">
                  {uploadingBg ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: data.theme_color }} /> : <><ImageIcon className="w-6 h-6 text-gray-600" /><span className="text-gray-500 text-xs">Background (fullscreen texture)</span></>}
                </div>}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'background_image')} className="hidden" />
          </label>
        </div>
      </div>
    ),

    2: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">📍</div>
          <h2 className="text-2xl font-black text-white">Where is your community?</h2>
          <p className="text-gray-400 mt-1">{isAdmin ? 'Choose any city 🌍' : 'Based on your current location 📡'}</p>
        </div>
        {isAdmin ? (
          <div>
            <label className="block text-gray-400 text-sm mb-2">City *</label>
            <Input value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })}
              placeholder="e.g. Braga, Porto, Lisbon..." className="bg-gray-900 border-gray-800 text-white text-lg py-6" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <p className="text-gray-400 text-sm mb-3">Detecting your city... 📡</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, { headers: { 'Accept-Language': 'en' } });
                    const d = await res.json();
                    const city = d.address?.city || d.address?.town || d.address?.village || '';
                    if (city) setData(prev => ({ ...prev, city }));
                  }, () => {});
                }
              }} className="px-6 py-3 rounded-xl font-bold text-sm" style={{ background: data.theme_color, color: '#0b0b0b' }}>
                📡 Detect My City
              </motion.button>
            </div>
            {data.city && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl p-4 text-center border" style={{ borderColor: `${data.theme_color}50`, background: `${data.theme_color}15` }}>
                <p className="text-2xl mb-1">📍</p>
                <p className="text-white font-black text-xl">{data.city}</p>
                <p className="text-gray-400 text-xs mt-1">Confirmed! ✅</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    ),

    3: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-black text-white">Community Vibe</h2>
          <p className="text-gray-400 mt-1">Choose up to 3 party types</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-2">Party Types * <span className="text-gray-600">({data.party_types.length}/3)</span></p>
          <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto">
            {ALL_PARTY_TYPES.map((tag) => (
              <PartyTag key={tag} tag={tag} size="md" interactive selected={data.party_types.includes(tag)}
                onClick={() => {
                  if (data.party_types.includes(tag)) setData({ ...data, party_types: data.party_types.filter(t => t !== tag) });
                  else if (data.party_types.length < 3) setData({ ...data, party_types: [...data.party_types, tag] });
                }} />
            ))}
          </div>
        </div>
      </div>
    ),

    4: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">⚙️</div>
          <h2 className="text-2xl font-black text-white">Plan Settings</h2>
          <p className="text-gray-400 mt-1">Who can create plans in your community?</p>
        </div>
        {[
          { key: 'anyone', emoji: '🌍', title: 'Anyone', desc: 'All members can create plans freely' },
          { key: 'approval_required', emoji: '✅', title: 'Needs Approval', desc: 'Members create, admins approve' },
          { key: 'admins_only', emoji: '👑', title: 'Admins Only', desc: 'Only community admins can create plans' },
        ].map((opt) => (
          <motion.button key={opt.key} whileTap={{ scale: 0.97 }}
            onClick={() => setData({ ...data, plan_creation_policy: opt.key })}
            className={`w-full p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all`}
            style={data.plan_creation_policy === opt.key
              ? { borderColor: data.theme_color, background: `${data.theme_color}18` }
              : { borderColor: '#374151', background: '#111827' }}>
            <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
            <div className="flex-1">
              <p className="text-white font-bold">{opt.title}</p>
              <p className="text-gray-400 text-sm">{opt.desc}</p>
            </div>
            {data.plan_creation_policy === opt.key && <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: data.theme_color }} />}
          </motion.button>
        ))}
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col">
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 p-4 flex items-center gap-4" style={{ paddingTop: 'max(env(safe-area-inset-top,0px),16px)' }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={goBack} className="p-2 rounded-full bg-gray-900">
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        <div className="flex-1 flex items-center justify-center gap-2">
          {STEPS.map((s) => (
            <motion.div key={s.id} animate={{ width: step === s.id ? 24 : 8, backgroundColor: step >= s.id ? data.theme_color : '#374151' }} className="h-2 rounded-full" />
          ))}
        </div>
        <div className="text-gray-500 text-sm w-10 text-right">{step}/4</div>
      </header>

      <div className="flex-1 overflow-y-auto relative">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="absolute inset-0 overflow-y-auto px-6 py-8">
            {stepContent[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-gray-900 bg-[#0b0b0b]">
        <motion.button whileTap={{ scale: 0.97 }} onClick={step < 4 ? goNext : handleSubmit}
          disabled={!canProceed() || loading}
          className="w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all text-[#0b0b0b] disabled:opacity-40"
          style={{ background: canProceed() && !loading ? `linear-gradient(135deg, ${data.theme_color}, #542b9b)` : '#374151', color: canProceed() ? '#0b0b0b' : '#6b7280' }}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : step < 4 ? <><span>Next</span><ArrowRight className="w-5 h-5" /></> : <>Create Community 🚀</>}
        </motion.button>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Image as ImageIcon, Loader2, Palette, Check, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PartyTag, { ALL_PARTY_TYPES } from '../components/common/PartyTag';
import { Search } from 'lucide-react';
import AddressAutocomplete from '../components/common/AddressAutocomplete';
import HighlightPlanModal from '../components/plan/HighlightPlanModal';
import PlanPrivacySettings from '../components/plan/PlanPrivacySettings';

const themeColors = [
  '#00c6d2', // teal branding
  '#542b9b', // deep purple
  '#ff6b6b', // coral red
  '#f8b500', // golden yellow
  '#ff69b4', // hot pink
  '#22c55e', // green
  '#f97316', // orange
  '#3b82f6', // blue
  '#e879f9', // fuchsia
  '#84cc16', // lime
  '#ef4444', // red
  '#a78bfa', // lavender
  '#06b6d4', // cyan
  '#fb923c', // amber orange
  '#ec4899', // pink
];

const STEPS = [
  { id: 1, label: 'Identity', emoji: '✨' },
  { id: 2, label: 'Date', emoji: '📅' },
  { id: 3, label: 'Time', emoji: '⏰' },
  { id: 4, label: 'Location', emoji: '📍' },
  { id: 5, label: 'Vibe', emoji: '🎉' },
  { id: 6, label: 'Privacy', emoji: '🔒' },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

export default function CreatePlan() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('communityId') || null;
  const [step, setStep] = useState(1);

  // Layer 2: block creation if user already has a happening plan they created
  React.useEffect(() => {
    const checkActiveплан = async () => {
      const user = await base44.auth.me();
      if (!user) return;
      const myPlans = await base44.entities.PartyPlan.filter({ creator_id: user.id });
      const hasHappening = myPlans.some(p => p.status === 'happening');
      setBlockedByActive(hasHappening);
    };
    checkActiveплан();
  }, []);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [blockedByActive, setBlockedByActive] = useState(false);
  const [createdPlan, setCreatedPlan] = useState(null);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGroup, setUploadingGroup] = useState(false);
  const [data, setData] = useState({
    title: '', description: '', date: '', time: '', end_time: '',
    location_address: '', city: '', tags: [],
    cover_image: '', group_image: '', theme_color: '#00c6d2',
    is_private: false, show_in_explore: true, show_in_map: true,
    audience_restrictions: {}
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const getMaxEndTime = (startTime) => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + 8 * 60;
    const endH = Math.floor((totalMins % (24 * 60)) / 60);
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const isEndTimeValid = (startTime, endTime) => {
    if (!startTime || !endTime) return true;
    const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let diff = toMins(endTime) - toMins(startTime);
    if (diff < 0) diff += 24 * 60;
    return diff > 0 && diff <= 8 * 60;
  };

  const toggleTag = (tag) => {
    if (data.tags.includes(tag)) {
      setData({ ...data, tags: data.tags.filter(t => t !== tag) });
    } else if (data.tags.length < 2) {
      setData({ ...data, tags: [...data.tags, tag] });
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (field === 'cover_image') setUploadingCover(true);
    else setUploadingGroup(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setData(prev => ({ ...prev, [field]: file_url }));
    if (field === 'cover_image') setUploadingCover(false);
    else setUploadingGroup(false);
  };

  const goNext = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    if (step === 1) { navigate(-1); return; }
    setDirection(-1);
    setStep(s => s - 1);
  };

  const canProceed = () => {
    if (step === 1) return !!data.title;
    if (step === 2) return !!data.date;
    if (step === 3) return !!data.time && !!data.end_time && isEndTimeValid(data.time, data.end_time);
    if (step === 4) return !!data.location_address && !!data.city;
    if (step === 5) return data.tags.length >= 1;
    if (step === 6) return true; // Privacy is always optional/valid
    return false;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    let latitude = null, longitude = null;
    try {
      const query = encodeURIComponent(`${data.location_address}, ${data.city}`);
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
      const geoData = await geoRes.json();
      if (geoData?.[0]) {
        latitude = parseFloat(geoData[0].lat);
        longitude = parseFloat(geoData[0].lon);
      }
    } catch (_) {}

    const plan = await base44.entities.PartyPlan.create({
      ...data,
      creator_id: user.id,
      view_count: 0,
      is_highlighted: false,
      is_private: data.is_private ?? false,
      show_in_explore: data.show_in_explore ?? true,
      show_in_map: data.is_private ? false : (data.show_in_map ?? true),
      audience_restrictions: data.audience_restrictions || {},
      ...(communityId ? { community_id: communityId } : {}),
      ...(latitude && longitude ? { latitude, longitude } : {})
    });

    await base44.entities.PlanParticipant.create({
      plan_id: plan.id,
      user_id: user.id,
      status: 'going'
    });

    setCreatedPlan(plan);
    setLoading(false);
    setDone(true);
  };

  // Layer 2: block UI if user already has a plan happening
  if (blockedByActive) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-black text-white mb-3">You already have a plan Live Now</h2>
        <p className="text-gray-400 mb-6 max-w-xs">You can only create a new plan when your current happening plan ends. This keeps the map fair for everyone.</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(-1)}
          className="px-8 py-4 rounded-2xl bg-gray-900 text-white font-bold border border-gray-700"
        >
          Go Back
        </motion.button>
      </div>
    );
  }

  // ---- SUCCESS SCREEN ----
  if (done && createdPlan) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center px-6 text-center overflow-y-auto">
        {/* Confetti-like floating emojis */}
        {['🎉', '🔥', '🎶', '✨', '🥂', '💃', '🎊', '🕺'].map((emoji, i) => (
          <motion.div
            key={i}
            initial={{ y: '100vh', x: `${(i * 13) % 90}vw`, opacity: 0, rotate: 0 }}
            animate={{ y: '-20vh', opacity: [0, 1, 1, 0], rotate: 360 }}
            transition={{ delay: i * 0.15, duration: 2.5, ease: 'easeOut' }}
            className="fixed text-3xl pointer-events-none z-0"
            style={{ left: `${(i * 13) % 90}%` }}
          >
            {emoji}
          </motion.div>
        ))}

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Big emoji */}
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-7xl mb-6"
          >
            🔥
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-black text-white mb-2"
          >
            Yaayyy, let's fire this! 🎊
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-[#00c6d2] text-lg font-bold mb-8"
          >
            Your plan is Ready! ✨
          </motion.p>

          {/* Group Chat Preview */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 mb-8"
          >
            {/* Chat header */}
            <div
              className="p-4 flex items-center gap-3"
              style={{ backgroundColor: `${createdPlan.theme_color}22` }}
            >
              {createdPlan.group_image ? (
                <img src={createdPlan.group_image} alt="" className="w-12 h-12 rounded-2xl object-cover" />
              ) : (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: createdPlan.theme_color }}
                >
                  🎉
                </div>
              )}
              <div className="text-left">
                <p className="text-white font-bold">{createdPlan.title}</p>
                <div className="flex gap-1 mt-0.5">
                  {createdPlan.tags?.map((tag, i) => (
                    <span key={i} className="text-xs text-gray-400">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Cover image preview */}
            {createdPlan.cover_image ? (
              <div className="h-36">
                <img src={createdPlan.cover_image} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="h-36 flex items-center justify-center text-5xl"
                style={{ background: `linear-gradient(135deg, ${createdPlan.theme_color}44, #542b9b44)` }}
              >
                🎉
              </div>
            )}

            {/* Chat bubbles mock */}
            <div className="p-4 space-y-3">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="flex items-end gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-[#542b9b] flex items-center justify-center text-xs">🦁</div>
                <div className="bg-gray-800 rounded-2xl rounded-bl-none px-3 py-2 text-sm text-white max-w-[70%]">
                  Let's gooo!! 🔥🔥
                </div>
              </motion.div>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="flex items-end gap-2 flex-row-reverse"
              >
                <div className="w-7 h-7 rounded-full bg-[#00c6d2] flex items-center justify-center text-xs">😎</div>
                <div
                  className="rounded-2xl rounded-br-none px-3 py-2 text-sm text-[#0b0b0b] font-medium max-w-[70%]"
                  style={{ backgroundColor: createdPlan.theme_color }}
                >
                  I'm in! 🎉
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="space-y-3"
          >
            {/* Highlight Plan CTA */}
            {!createdPlan.is_highlighted && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowHighlightModal(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-400 font-bold text-lg flex items-center justify-center gap-2"
              >
                🔥 Highlight Plan — €2.99
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${createdPlan.id}`)}
              className="w-full py-4 rounded-2xl bg-[#00c6d2] text-[#0b0b0b] font-bold text-lg"
            >
              Open my Plan 🚀
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(createPageUrl('GroupChat') + `?planId=${createdPlan.id}`)}
              className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold border border-gray-700"
            >
              Go to Group Chat 💬
            </motion.button>
          </motion.div>
        </motion.div>
        <HighlightPlanModal
          isOpen={showHighlightModal}
          onClose={() => setShowHighlightModal(false)}
          planTitle={createdPlan.title}
          planTags={createdPlan.tags || []}
          onConfirm={() => {
            base44.entities.PartyPlan.update(createdPlan.id, { is_highlighted: true });
            setCreatedPlan(prev => ({ ...prev, is_highlighted: true }));
          }}
        />
      </div>
    );
  }

  // ---- ONBOARDING STEPS ----
  const stepContent = {
    1: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">✨</div>
          <h2 className="text-2xl font-black text-white">Name your plan</h2>
          <p className="text-gray-400 mt-1">Give it a vibe! What's this plan about?</p>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Plan Name *</label>
          <Input
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="e.g. Techno Night at Rooftop 🎧"
            className="bg-gray-900 border-gray-800 text-white text-lg py-6"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Description <span className="text-gray-600">(optional)</span></label>
          <Textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            placeholder="Tell people what to expect... 🔥"
            className="bg-gray-900 border-gray-800 text-white min-h-24"
          />
        </div>

        {/* Theme Color */}
        <div>
          <label className="block text-gray-400 text-sm mb-3 flex items-center gap-1.5">
            <Palette className="w-4 h-4" />
            Theme Color
          </label>
          <div className="flex gap-3 flex-wrap">
            {themeColors.map((color) => (
              <motion.button
                key={color}
                whileTap={{ scale: 0.9 }}
                onClick={() => setData({ ...data, theme_color: color })}
                className="relative w-10 h-10 rounded-xl transition-all"
                style={{ backgroundColor: color }}
              >
                {data.theme_color === color && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-[#0b0b0b]" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Cover Image <span className="text-gray-600">(optional)</span></label>
          <label className="block cursor-pointer">
            {data.cover_image ? (
              <div className="relative h-40 rounded-2xl overflow-hidden">
                <img src={data.cover_image} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium">Change 📸</span>
                </div>
              </div>
            ) : (
              <div className="h-40 rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-gray-500 transition-colors">
                {uploadingCover ? <Loader2 className="w-6 h-6 text-[#00c6d2] animate-spin" /> : <>
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                  <span className="text-gray-500 text-sm">Add a cover photo 🌆</span>
                </>}
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover_image')} className="hidden" />
          </label>
        </div>

        {/* Group Image */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Group Chat Icon <span className="text-gray-600">(optional)</span></label>
          <label className="cursor-pointer flex items-center gap-4">
            {data.group_image ? (
              <img src={data.group_image} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center hover:border-gray-500 transition-colors">
                {uploadingGroup ? <Loader2 className="w-5 h-5 text-[#00c6d2] animate-spin" /> : <ImageIcon className="w-5 h-5 text-gray-600" />}
              </div>
            )}
            <span className="text-gray-500 text-sm">Small icon for the group chat 💬</span>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'group_image')} className="hidden" />
          </label>
        </div>
      </div>
    ),

    2: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">📅</div>
          <h2 className="text-2xl font-black text-white">When's the plan?</h2>
          <p className="text-gray-400 mt-1">Pick a date — up to 30 days from now!</p>
        </div>
        <div>
          <Input
            type="date"
            value={data.date}
            min={todayStr}
            max={maxDateStr}
            onChange={(e) => {
              const val = e.target.value;
              if (val < todayStr || val > maxDateStr) return;
              setData({ ...data, date: val });
            }}
            className="bg-gray-900 border-gray-800 text-white text-center text-xl py-8"
          />
          <p className="text-xs text-gray-600 mt-2 text-center">Max 30 days from today 📆</p>
        </div>
      </div>
    ),

    3: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">⏰</div>
          <h2 className="text-2xl font-black text-white">What time?</h2>
          <p className="text-gray-400 mt-1">Start and end time (max 8h duration)</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2 text-center">Start time 🌙</label>
            <Input
              type="time"
              value={data.time}
              onChange={(e) => setData({ ...data, time: e.target.value, end_time: '' })}
              className="bg-gray-900 border-gray-800 text-white text-center"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2 text-center">End time 🌅</label>
            <Input
              type="time"
              value={data.end_time}
              onChange={(e) => setData({ ...data, end_time: e.target.value })}
              disabled={!data.time}
              className="bg-gray-900 border-gray-800 text-white text-center disabled:opacity-40"
            />
          </div>
        </div>
        {data.time && data.end_time && !isEndTimeValid(data.time, data.end_time) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm text-center"
          >
            ⚠️ Max duration is 8 hours!
          </motion.p>
        )}
        {data.time && data.end_time && isEndTimeValid(data.time, data.end_time) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#00c6d2]/10 border border-[#00c6d2]/30 rounded-2xl p-4 text-center"
          >
            <p className="text-[#00c6d2] font-bold">{data.time} → {data.end_time} ✅</p>
          </motion.div>
        )}
      </div>
    ),

    4: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">📍</div>
          <h2 className="text-2xl font-black text-white">Where is it?</h2>
          <p className="text-gray-400 mt-1">Search and pick the address from suggestions!</p>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-2">Search Address *</label>
          <AddressAutocomplete
            value={data.location_address}
            onChange={(val) => setData(prev => ({ ...prev, location_address: val }))}
            onSelect={({ address, city, latitude, longitude }) => {
              setData(prev => ({ ...prev, location_address: address, city, latitude, longitude }));
            }}
            placeholder="e.g. Gran Via 123, Madrid..."
          />
        </div>
        {data.location_address ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16 shrink-0">Address</span>
              <span className="text-white text-sm">{data.location_address}</span>
            </div>
            {data.city && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-16 shrink-0">City</span>
                <span className="text-[#00c6d2] text-sm font-medium">{data.city}</span>
              </div>
            )}
            {data.city && (
              <div>
                <label className="block text-gray-500 text-xs mb-1">Edit city (optional)</label>
                <Input
                  value={data.city}
                  onChange={(e) => setData(prev => ({ ...prev, city: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white text-sm py-2"
                />
              </div>
            )}
          </div>
        ) : null}
      </div>
    ),

    5: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-black text-white">What's the vibe?</h2>
          <p className="text-gray-400 mt-1">Pick up to 2 party types that fit your plan</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Selected</span>
          <span className={`text-sm font-bold ${data.tags.length >= 2 ? 'text-[#00c6d2]' : 'text-gray-500'}`}>
            {data.tags.length}/2
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Search party types..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00c6d2]"
          />
        </div>
        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
          {ALL_PARTY_TYPES.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).map((tag) => (
            <PartyTag
              key={tag}
              tag={tag}
              size="md"
              interactive
              selected={data.tags.includes(tag)}
              onClick={() => toggleTag(tag)}
            />
          ))}
        </div>
      </div>
    ),

    6: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-2xl font-black text-white">Privacy & Access</h2>
          <p className="text-gray-400 mt-1">Control who can see and join your plan</p>
        </div>
        <PlanPrivacySettings
          data={data}
          onChange={(updates) => setData(prev => ({ ...prev, ...updates }))}
        />
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 p-4 flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goBack}
          className="p-2 rounded-full bg-gray-900"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>

        {/* Step progress dots */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {STEPS.map((s) => (
            <motion.div
              key={s.id}
              animate={{
                width: step === s.id ? 24 : 8,
                backgroundColor: step > s.id ? '#00c6d2' : step === s.id ? '#00c6d2' : '#374151'
              }}
              className="h-2 rounded-full"
            />
          ))}
        </div>

        <div className="text-gray-500 text-sm w-10 text-right">
          {step}/6
        </div>
      </header>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto relative">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 overflow-y-auto px-6 py-8"
          >
            {stepContent[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next / Create Button */}
      <div className="p-6 border-t border-gray-900 bg-[#0b0b0b]">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={step < 6 ? goNext : handleSubmit}
          disabled={!canProceed() || loading}
          className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            canProceed() && !loading
              ? 'bg-[#00c6d2] text-[#0b0b0b]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : step < 6 ? (
            <>Next <ArrowRight className="w-5 h-5" /></>
          ) : (
            <>Create Plan 🔥</>
          )}
        </motion.button>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
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
import { useLanguage } from '../components/common/LanguageContext';

const themeColors = [
  '#00c6d2', '#542b9b', '#ff6b6b', '#f8b500', '#ff69b4',
  '#22c55e', '#f97316', '#3b82f6', '#e879f9', '#84cc16',
  '#ef4444', '#a78bfa', '#06b6d4', '#fb923c', '#ec4899',
];

const STEPS = [
  { id: 1, label: 'Community', emoji: '⭐' },
  { id: 2, label: 'Identity', emoji: '✨' },
  { id: 3, label: 'Date', emoji: '📅' },
  { id: 4, label: 'Time', emoji: '⏰' },
  { id: 5, label: 'Location', emoji: '📍' },
  { id: 6, label: 'Vibe', emoji: '🎉' },
  { id: 7, label: 'Privacy', emoji: '🔒' },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

export default function CreatePlan() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const communityIdFromUrl = urlParams.get('communityId') || null;
  const [selectedCommunityId, setSelectedCommunityId] = useState(communityIdFromUrl);
  const [myCommunities, setMyCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const memberships = await base44.entities.CommunityMember.filter({ user_id: user.id });
        if (memberships.length === 0) { setMyCommunities([]); setLoadingCommunities(false); return; }
        const communities = await base44.entities.Community.list('-created_date', 100);
        const joined = communities.filter(c => memberships.some(m => m.community_id === c.id) && !c.is_deleted);
        setMyCommunities(joined);
      } catch (_) {}
      setLoadingCommunities(false);
    };
    load();
  }, []);

  const communityId = selectedCommunityId;
  const startStep = communityIdFromUrl ? 2 : 1;
  const [step, setStep] = useState(startStep);

  useEffect(() => {
    const checkActivePlan = async () => {
      const user = await base44.auth.me();
      if (!user) return;
      const myPlans = await base44.entities.PartyPlan.filter({ creator_id: user.id });
      const hasHappening = myPlans.some(p => p.status === 'happening');
      setBlockedByActive(hasHappening);
    };
    checkActivePlan();
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

  const isEndTimeValid = (startTime, endTime) => {
    if (!startTime || !endTime) return true;
    const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let diff = toMins(endTime) - toMins(startTime);
    if (diff < 0) diff += 24 * 60;
    return diff > 0 && diff <= 8 * 60;
  };

  const toggleTag = (tag) => {
    if (data.tags.includes(tag)) {
      setData({ ...data, tags: data.tags.filter(tg => tg !== tag) });
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

  const goNext = () => { setDirection(1); setStep(s => s + 1); };
  const goBack = () => {
    if (step === startStep) { navigate(-1); return; }
    setDirection(-1);
    setStep(s => s - 1);
  };

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return !!data.title;
    if (step === 3) return !!data.date;
    if (step === 4) return !!data.time && !!data.end_time && isEndTimeValid(data.time, data.end_time);
    if (step === 5) return !!data.location_address && !!data.city;
    if (step === 6) return data.tags.length >= 1;
    if (step === 7) return true;
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

  // ---- BLOCKED SCREEN ----
  if (blockedByActive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-black text-white mb-3">{t.blockedActivePlanTitle}</h2>
        <p className="text-gray-400 mb-6 max-w-xs">{t.blockedActivePlanDesc}</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(-1)}
          className="px-8 py-4 rounded-2xl bg-gray-900 text-white font-bold border border-gray-700"
        >
          {t.back}
        </motion.button>
      </div>
    );
  }

  // ---- SUCCESS SCREEN ----
  if (done && createdPlan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-y-auto" style={{ background: 'var(--bg)' }}>
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
            {t.planCreatedTitle}
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-[#00c6d2] text-lg font-bold mb-8"
          >
            {t.planCreatedSubtitle}
          </motion.p>

          {/* Group Chat Preview */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 mb-8"
          >
            <div className="p-4 flex items-center gap-3" style={{ backgroundColor: `${createdPlan.theme_color}22` }}>
              {createdPlan.group_image ? (
                <img src={createdPlan.group_image} alt="" className="w-12 h-12 rounded-2xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl" style={{ backgroundColor: createdPlan.theme_color }}>
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

            <div className="p-4 space-y-3">
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.1 }} className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-[#542b9b] flex items-center justify-center text-xs">🦁</div>
                <div className="bg-gray-800 rounded-2xl rounded-bl-none px-3 py-2 text-sm text-white max-w-[70%]">
                  {t.chatBubble1}
                </div>
              </motion.div>
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.3 }} className="flex items-end gap-2 flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-[#00c6d2] flex items-center justify-center text-xs">😎</div>
                <div
                  className="rounded-2xl rounded-br-none px-3 py-2 text-sm text-[#0b0b0b] font-medium max-w-[70%]"
                  style={{ backgroundColor: createdPlan.theme_color }}
                >
                  {t.chatBubble2}
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2 }} className="space-y-3">
            {!createdPlan.is_highlighted && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowHighlightModal(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-400 font-bold text-lg flex items-center justify-center gap-2"
              >
                {t.highlightPlan}
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${createdPlan.id}`, { replace: true })}
              className="w-full py-4 rounded-2xl bg-[#00c6d2] text-[#0b0b0b] font-bold text-lg"
            >
              {t.openMyPlan}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(createPageUrl('GroupChat') + `?planId=${createdPlan.id}`, { replace: true })}
              className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold border border-gray-700"
            >
              {t.goToGroupChat}
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
          <div className="text-5xl mb-3">⭐</div>
          <h2 className="text-2xl font-black text-white">{t.stepCommunityTitle}</h2>
          <p className="text-gray-400 mt-1">{t.stepCommunityDesc}</p>
        </div>

        {loadingCommunities ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#00c6d2] animate-spin" /></div>
        ) : myCommunities.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="text-4xl">🏜️</div>
            <p className="text-gray-400 text-sm">{t.noCommunitiesYet}</p>
            <p className="text-gray-600 text-xs">{t.noCommunitiesIndividual}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedCommunityId(null)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border transition-all"
              style={!selectedCommunityId
                ? { borderColor: '#00c6d2', background: '#00c6d210' }
                : { borderColor: '#374151', background: 'transparent' }}
            >
              <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-2xl shrink-0">🎯</div>
              <div className="text-left flex-1">
                <p className="text-white font-bold">{t.individualPlan}</p>
                <p className="text-gray-500 text-xs">{t.individualPlanDesc}</p>
              </div>
              {!selectedCommunityId && <Check className="w-5 h-5 text-[#00c6d2] shrink-0" />}
            </motion.button>

            {myCommunities.map(c => (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCommunityId(c.id)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border transition-all"
                style={selectedCommunityId === c.id
                  ? { borderColor: c.theme_color || '#00c6d2', background: `${c.theme_color || '#00c6d2'}12` }
                  : { borderColor: '#374151', background: 'transparent' }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  {c.cover_image
                    ? <img src={c.cover_image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl" style={{ background: `${c.theme_color || '#00c6d2'}44` }}>⭐</div>}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-white font-bold truncate">{c.name}</p>
                  <p className="text-gray-500 text-xs">📍 {c.city}</p>
                </div>
                {selectedCommunityId === c.id && <Check className="w-5 h-5 shrink-0" style={{ color: c.theme_color || '#00c6d2' }} />}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    ),

    2: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">✨</div>
          <h2 className="text-2xl font-black text-white">{t.stepIdentityTitle}</h2>
          <p className="text-gray-400 mt-1">{t.stepIdentityDesc}</p>
        </div>

        {communityId && (() => {
          const c = myCommunities.find(c => c.id === communityId);
          if (!c) return null;
          return (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border" style={{ borderColor: `${c.theme_color || '#00c6d2'}50`, background: `${c.theme_color || '#00c6d2'}12` }}>
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                {c.cover_image
                  ? <img src={c.cover_image} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: `${c.theme_color || '#00c6d2'}44` }}>⭐</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{t.addingToCommunity}</p>
                <p className="text-white font-bold truncate">{c.name}</p>
              </div>
              <span className="text-lg">⭐</span>
            </div>
          );
        })()}

        <div>
          <label className="block text-gray-400 text-sm mb-2">{t.planName} *</label>
          <Input
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder={t.planNamePlaceholder}
            className="bg-gray-900 border-gray-800 text-white text-lg py-6"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">{t.descriptionOptional} <span className="text-gray-600">({t.optional})</span></label>
          <Textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            placeholder={t.planDescPlaceholder}
            className="bg-gray-900 border-gray-800 text-white min-h-24"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-3 flex items-center gap-1.5">
            <Palette className="w-4 h-4" />
            {t.themeColor}
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
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#0b0b0b]" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">{t.planCover} <span className="text-gray-600">({t.optional})</span></label>
          <label className="block cursor-pointer">
            {data.cover_image ? (
              <div className="relative h-40 rounded-2xl overflow-hidden">
                <img src={data.cover_image} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium">{t.changeCover} 📸</span>
                </div>
              </div>
            ) : (
              <div className="h-40 rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-gray-500 transition-colors">
                {uploadingCover ? <Loader2 className="w-6 h-6 text-[#00c6d2] animate-spin" /> : <>
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                  <span className="text-gray-500 text-sm">{t.addCoverPhoto} 🌆</span>
                </>}
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover_image')} className="hidden" />
          </label>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">{t.groupChatIcon} <span className="text-gray-600">({t.optional})</span></label>
          <label className="cursor-pointer flex items-center gap-4">
            {data.group_image ? (
              <img src={data.group_image} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center hover:border-gray-500 transition-colors">
                {uploadingGroup ? <Loader2 className="w-5 h-5 text-[#00c6d2] animate-spin" /> : <ImageIcon className="w-5 h-5 text-gray-600" />}
              </div>
            )}
            <span className="text-gray-500 text-sm">{t.groupChatIconDesc} 💬</span>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'group_image')} className="hidden" />
          </label>
        </div>
      </div>
    ),

    3: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">📅</div>
          <h2 className="text-2xl font-black text-white">{t.stepDateTitle}</h2>
          <p className="text-gray-400 mt-1">{t.stepDateDesc}</p>
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
          <p className="text-xs text-gray-600 mt-2 text-center">{t.stepDateMax} 📆</p>
        </div>
      </div>
    ),

    4: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">⏰</div>
          <h2 className="text-2xl font-black text-white">{t.stepTimeTitle}</h2>
          <p className="text-gray-400 mt-1">{t.stepTimeDesc}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2 text-center">{t.startTime2} 🌙</label>
            <Input
              type="time"
              value={data.time}
              onChange={(e) => setData({ ...data, time: e.target.value, end_time: '' })}
              className="bg-gray-900 border-gray-800 text-white text-center"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2 text-center">{t.endTime2} 🌅</label>
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
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm text-center">
            ⚠️ {t.maxDurationWarning}
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

    5: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">📍</div>
          <h2 className="text-2xl font-black text-white">{t.stepLocationTitle}</h2>
          <p className="text-gray-400 mt-1">{t.stepLocationDesc}</p>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-2">{t.searchAddress} *</label>
          <AddressAutocomplete
            value={data.location_address}
            onChange={(val) => setData(prev => ({ ...prev, location_address: val }))}
            onSelect={({ address, city, latitude, longitude }) => {
              setData(prev => ({ ...prev, location_address: address, city, latitude, longitude }));
            }}
            placeholder={t.addressPlaceholder}
            userCity={localStorage.getItem('selectedCity') || ''}
          />
        </div>
        {data.location_address ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16 shrink-0">{t.address}</span>
              <span className="text-white text-sm">{data.location_address}</span>
            </div>
            {data.city && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-16 shrink-0">{t.city}</span>
                <span className="text-[#00c6d2] text-sm font-medium">{data.city}</span>
              </div>
            )}
            {data.city && (
              <div>
                <label className="block text-gray-500 text-xs mb-1">{t.editCityOptional}</label>
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

    6: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-black text-white">{t.stepVibeTitle}</h2>
          <p className="text-gray-400 mt-1">{t.stepVibeDesc}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">{t.selected}</span>
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
            placeholder={t.searchPartyTypes}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00c6d2]"
          />
        </div>
        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
          {ALL_PARTY_TYPES.filter(tg => tg.toLowerCase().includes(tagSearch.toLowerCase())).map((tag) => (
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

    7: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-2xl font-black text-white">{t.stepPrivacyTitle}</h2>
          <p className="text-gray-400 mt-1">{t.stepPrivacyDesc}</p>
        </div>
        <PlanPrivacySettings
          data={data}
          onChange={(updates) => setData(prev => ({ ...prev, ...updates }))}
        />
      </div>
    ),
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-40 backdrop-blur-lg border-b border-gray-800 p-4 flex items-center gap-4"
        style={{ background: 'var(--bg)', opacity: 0.95 }}
      >
        <motion.button whileTap={{ scale: 0.9 }} onClick={goBack} className="p-2 rounded-full bg-gray-900">
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>

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

        <div className="text-gray-500 text-sm w-10 text-right">{step}/7</div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="px-6 pt-8 pb-6"
          >
            {stepContent[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 p-6 border-t border-gray-900" style={{ background: 'var(--bg)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={step < 7 ? goNext : handleSubmit}
          disabled={!canProceed() || loading}
          className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            canProceed() && !loading ? 'bg-[#00c6d2] text-[#0b0b0b]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : step < 7 ? (
            <>{t.continue} <ArrowRight className="w-5 h-5" /></>
          ) : (
            <>{t.createPlanBtn} 🔥</>
          )}
        </motion.button>
      </div>
    </div>
  );
}
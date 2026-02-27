import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, X, Loader2, AlertCircle, ShieldAlert,
  Users, Lock, Sparkles, Camera, ImageIcon, Check, Eye
} from 'lucide-react';
import HighlightStoryModal from '../components/story/HighlightStoryModal';
import CameraView from '../components/story/CameraView';

// Step 1: Select Plan
function StepSelectPlan({ activePlans, myParticipations, selectedPlan, onSelect, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex flex-col h-full"
    >
      <div className="px-4 pt-4 pb-2">
        <p className="text-gray-400 text-sm">Which plan is this for?</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
        {activePlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <AlertCircle className="w-10 h-10 text-gray-600" />
            <p className="text-gray-500 text-center text-sm">No active plans yet.<br />Join a plan and wait for it to start.</p>
          </div>
        ) : (
          activePlans.map((plan) => {
            const participation = myParticipations.find(p => p.plan_id === plan.id);
            const posted = participation?.stories_posted || 0;
            const full = posted >= 5;
            return (
              <motion.button
                key={plan.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => !full && onSelect(plan.id)}
                className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                  selectedPlan === plan.id
                    ? 'border-[#00fea3] bg-[#00fea3]/10'
                    : full
                    ? 'border-gray-800 bg-gray-900/50 opacity-50'
                    : 'border-gray-800 bg-gray-900 active:border-gray-600'
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#542b9b] to-[#00fea3]/40 flex items-center justify-center flex-shrink-0">
                  {plan.cover_image ? (
                    <img src={plan.cover_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🎉</span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`font-semibold truncate ${selectedPlan === plan.id ? 'text-[#00fea3]' : 'text-white'}`}>
                    {plan.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{plan.city} • {posted}/5 stories</p>
                </div>
                {selectedPlan === plan.id && <Check className="w-5 h-5 text-[#00fea3] flex-shrink-0" />}
                {full && <span className="text-xs text-red-400 flex-shrink-0">Full</span>}
              </motion.button>
            );
          })
        )}
      </div>
      <div className="px-4 pb-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          disabled={!selectedPlan}
          className={`w-full py-4 rounded-full font-bold text-base transition-all ${
            selectedPlan ? 'bg-[#00fea3] text-[#0b0b0b]' : 'bg-gray-800 text-gray-600'
          }`}
        >
          Next →
        </motion.button>
      </div>
    </motion.div>
  );
}

// Step 2: handled by CameraView

// Step 3: Preview & Publish
function StepPreview({ media, plans, selectedPlan, onPublish, onRetake, submitting, onVisibilityChange, visibility }) {
  const plan = plans.find(p => p.id === selectedPlan);

  const visibilityOptions = [
    { id: 'friends', icon: Users, label: 'Friends' },
    { id: 'group_only', icon: Lock, label: 'Group' },
    { id: 'highlighted', icon: Sparkles, label: 'Highlight', paid: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="relative flex flex-col h-full"
    >
      {/* Full-screen preview */}
      <div className="absolute inset-0">
        {media.isVideo ? (
          <video
            src={media.file_url}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img src={media.file_url} alt="Story preview" className="w-full h-full object-cover" />
        )}
        {/* Dark overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onRetake}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </motion.button>

        {plan && (
          <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
            <p className="text-white text-xs font-medium">📍 {plan.title}</p>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-8 space-y-3">
        {/* Visibility quick toggle */}
        <div className="flex gap-2 justify-center">
          {visibilityOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onVisibilityChange(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  visibility === opt.id
                    ? 'bg-[#00fea3] text-[#0b0b0b]'
                    : 'bg-black/50 backdrop-blur-sm text-white border border-white/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {opt.label}
                {opt.paid && <span className="ml-0.5 text-[9px] opacity-70">€</span>}
              </motion.button>
            );
          })}
        </div>

        {/* Share button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onPublish}
          disabled={submitting}
          className="w-full py-4 rounded-full bg-[#00fea3] text-[#0b0b0b] font-bold text-base flex items-center justify-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Eye className="w-5 h-5" />
              Share Story
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function AddStory() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedPlanId = urlParams.get('planId');

  const [step, setStep] = useState(preselectedPlanId ? 1 : 0); // 0=select plan, 1=camera, 2=preview
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlanId || '');
  const [media, setMedia] = useState(null);
  const [visibility, setVisibility] = useState('friends');
  const [submitting, setSubmitting] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [processingMedia, setProcessingMedia] = useState(false);
  const [moderationError, setModerationError] = useState('');

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => navigate(createPageUrl('Onboarding')));
  }, []);

  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 50),
  });

  const myPlanIds = myParticipations.map(p => p.plan_id);
  const myPlans = plans.filter(p => myPlanIds.includes(p.id));
  const activePlans = myPlans.filter((plan) => {
    const now = new Date();
    const planDateTime = new Date(`${plan.date}T${plan.time}`);
    return now >= planDateTime;
  });

  const currentParticipation = myParticipations.find(p => p.plan_id === selectedPlan);
  const storiesPosted = currentParticipation?.stories_posted || 0;
  const canPostMore = storiesPosted < 5;

  const handlePublish = async (highlightData = null) => {
    if (!media || !selectedPlan || !canPostMore) return;
    setSubmitting(true);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const storyData = {
      user_id: currentUser.id,
      plan_id: selectedPlan,
      media_url: media.file_url,
      thumbnail_url: media.isVideo ? media.thumbUrl : '',
      media_type: media.isVideo ? 'video' : 'image',
      visibility,
      is_highlighted: visibility === 'highlighted',
      view_count: 0,
      viewed_by: [],
      expires_at: expiresAt.toISOString()
    };

    if (highlightData) {
      storyData.target_vibes = highlightData.targetVibes;
      storyData.target_party_types = highlightData.targetPartyTypes;
    }

    await base44.entities.ExperienceStory.create(storyData);

    if (currentParticipation) {
      await base44.entities.PlanParticipant.update(currentParticipation.id, {
        stories_posted: storiesPosted + 1
      });
    }

    setSubmitting(false);
    navigate(createPageUrl('Home'));
  };

  const processFile = async (file) => {
    setProcessingMedia(true);
    setModerationError('');
    const isVideo = file.type.startsWith('video');

    const generateVideoThumbnail = (f) => new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'auto'; video.muted = true; video.playsInline = true;
      const url = URL.createObjectURL(f);
      video.src = url;
      const capture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320; canvas.height = video.videoHeight || 568;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob); }, 'image/jpeg', 0.85);
      };
      video.addEventListener('seeked', capture, { once: true });
      video.addEventListener('loadedmetadata', () => { video.currentTime = 0.01; }, { once: true });
      setTimeout(() => { if (video.videoWidth > 0) capture(); else { URL.revokeObjectURL(url); resolve(null); } }, 5000);
    });

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    let thumbUrl = '';
    let urlToModerate = file_url;

    if (isVideo) {
      const thumbBlob = await generateVideoThumbnail(file);
      if (thumbBlob) {
        const thumbFile = new File([thumbBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
        const { file_url: tu } = await base44.integrations.Core.UploadFile({ file: thumbFile });
        thumbUrl = tu; urlToModerate = tu;
      }
    }

    const modResult = await base44.functions.invoke('moderateImage', { image_url: urlToModerate, context: 'story' });
    if (!modResult.data.approved) {
      setModerationError(modResult.data.reason || 'This content is not allowed.');
      setProcessingMedia(false);
      return;
    }

    setMedia({ file, file_url, thumbUrl, isVideo });
    setProcessingMedia(false);
    setStep(2);
  };

  const handleVisibilityChange = (v) => {
    setVisibility(v);
    if (v === 'highlighted') setShowHighlightModal(true);
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const steps = ['Plan', 'Capture', 'Preview'];

  return (
    <div className="fixed inset-0 bg-[#0b0b0b] flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header - only show on steps 0 */}
      {step === 0 && (
        <header className="flex-shrink-0 flex items-center gap-3 px-4 py-4 border-b border-gray-800">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-900"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-lg font-bold text-white">Add Story</h1>

          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-[#00fea3]' : i < step ? 'w-3 bg-[#00fea3]/50' : 'w-3 bg-gray-700'
                }`}
              />
            ))}
          </div>
        </header>
      )}

      {/* Step back button for step 1 */}
      {step === 1 && (
        <header className="flex-shrink-0 flex items-center gap-3 px-4 py-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setStep(0)}
            className="p-2 rounded-full bg-gray-900"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-lg font-bold text-white">Capture</h1>
          <div className="ml-auto flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-[#00fea3]' : i < step ? 'w-3 bg-[#00fea3]/50' : 'w-3 bg-gray-700'
                }`}
              />
            ))}
          </div>
        </header>
      )}

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <div key="plan" className="absolute inset-0 flex flex-col">
              <StepSelectPlan
                activePlans={activePlans}
                myParticipations={myParticipations}
                selectedPlan={selectedPlan}
                onSelect={setSelectedPlan}
                onNext={() => setStep(1)}
              />
            </div>
          )}

          {step === 1 && (
            <div key="camera" className="absolute inset-0">
              {processingMedia ? (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4 z-50">
                  <Loader2 className="w-12 h-12 text-[#00fea3] animate-spin" />
                  <p className="text-gray-300 text-sm">Processing & checking content...</p>
                </div>
              ) : (
                <CameraView
                  onCapture={(file) => processFile(file)}
                  onSelectFromGallery={(file) => processFile(file)}
                  onClose={() => setStep(0)}
                />
              )}
              {moderationError && (
                <div className="absolute bottom-36 left-4 right-4 p-3 rounded-xl bg-red-500/90 flex items-start gap-3 z-50">
                  <ShieldAlert className="w-5 h-5 text-white flex-shrink-0" />
                  <p className="text-sm text-white">{moderationError}</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && media && (
            <div key="preview" className="absolute inset-0">
              <StepPreview
                media={media}
                plans={plans}
                selectedPlan={selectedPlan}
                visibility={visibility}
                onVisibilityChange={handleVisibilityChange}
                onPublish={() => visibility === 'highlighted' ? setShowHighlightModal(true) : handlePublish()}
                onRetake={() => { setMedia(null); setStep(1); }}
                submitting={submitting}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      <HighlightStoryModal
        isOpen={showHighlightModal}
        onClose={() => { setShowHighlightModal(false); setVisibility('friends'); }}
        onConfirm={(data) => { setShowHighlightModal(false); handlePublish(data); }}
        planCity={selectedPlanData?.city || ''}
        isLoading={submitting}
      />
    </div>
  );
}
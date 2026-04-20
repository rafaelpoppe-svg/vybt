import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, Send, ChevronLeft, RotateCcw, MapPin, Loader2, Zap, ZapOff } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../components/common/LanguageContext';

function PlanSelectorSheet({ plans, selectedPlanId, onSelect, onClose }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      className="absolute bottom-0 left-0 right-0 z-50 border-t border-gray-800 rounded-t-3xl overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-800">
        <div className="w-10 h-1 rounded-full bg-gray-700 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
        <p className="text-white font-bold text-base pt-2">{t.postToPlan}</p>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="p-1.5 rounded-full bg-gray-800">
          <X className="w-4 h-4 text-gray-400" />
        </motion.button>
      </div>
      <div className="px-4 py-3 space-y-2 max-h-72 overflow-y-auto">
        {plans.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">{t.noHappeningPlans}</p>
        )}
        {plans.map(plan => (
          <motion.button
            key={plan.id} whileTap={{ scale: 0.97 }}
            onClick={() => { onSelect(plan); onClose(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
              selectedPlanId === plan.id ? 'border-[#00c6d2] bg-[#00c6d2]/10' : 'border-gray-800 bg-gray-900/60'
            }`}
          >
            {plan.cover_image
              ? <img src={plan.cover_image} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
              : <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00c6d2]/30 to-[#542b9b]/30 flex items-center justify-center text-lg flex-shrink-0">🎉</div>
            }
            <div className="flex-1 text-left min-w-0">
              <p className="text-white font-semibold text-sm truncate">{plan.title}</p>
              <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{plan.location_address}
              </p>
            </div>
            {selectedPlanId === plan.id && (
              <div className="w-5 h-5 rounded-full bg-[#00c6d2] flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default function AddStory() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const urlParams = new URLSearchParams(window.location.search);
  const planIdFromUrl = urlParams.get('planId');
  const challengeIdFromUrl = urlParams.get('challengeId');

  const [phase, setPhase] = useState(planIdFromUrl ? 'camera' : 'plan_select');
  const [mode, setMode] = useState('photo');
  const [facingMode, setFacingMode] = useState('user');
  const [capturedMedia, setCapturedMedia] = useState(null);
  const [flashOn, setFlashOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [showPlanSheet, setShowPlanSheet] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [caption, setCaption] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const blockPiP = useCallback((el) => {
    if (!el) return;
    el.disablePictureInPicture = true;
    el.setAttribute('disablepictureinpicture', '');
    el.setAttribute('x-webkit-airplay', 'deny');
    el.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
    el.addEventListener('enterpictureinpicture', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    }, true);
  }, []);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => navigate('/'));
  }, []);

  const { data: happeningParticipations = [] } = useQuery({
    queryKey: ['happeningParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser.id }),
    enabled: !!currentUser?.id,
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ['happeningPlans'],
    queryFn: () => base44.entities.PartyPlan.filter({ status: 'happening' }),
    enabled: happeningParticipations.length > 0,
  });

  const happeningPlans = allPlans.filter(p =>
    happeningParticipations.some(pp => pp.plan_id === p.id)
  );

  // Pre-select plan from URL param as soon as plans are loaded
  useEffect(() => {
    if (planIdFromUrl && happeningPlans.length > 0 && !selectedPlan) {
      const plan = happeningPlans.find(p => p.id === planIdFromUrl);
      if (plan) setSelectedPlan(plan);
    }
  }, [happeningPlans, planIdFromUrl]);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 }, aspectRatio: { ideal: 9 / 16 } },
        audio: mode === 'video',
      });
      streamRef.current = stream;
      if (videoRef.current) {
        blockPiP(videoRef.current);
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      toast.error(t.cameraNotAvailable);
    }
  }, [facingMode, mode, blockPiP, t]);

  useEffect(() => {
    if (phase === 'camera') startCamera();
    else if (phase !== 'camera' && streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, [phase, facingMode, mode]);

  const flipCamera = () => setFacingMode(f => f === 'user' ? 'environment' : 'user');

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const file = new File([blob], `story_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setCapturedMedia({ url, type: 'image', file });
      setPhase('preview');
      streamRef.current?.getTracks().forEach(t => t.stop());
    }, 'image/jpeg', 0.92);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp8,opus' });
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const file = new File([blob], `story_${Date.now()}.webm`, { type: 'video/webm' });
      setCapturedMedia({ url, type: 'video', file });
      setPhase('preview');
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setIsRecording(true);
    setRecordProgress(0);
    let elapsed = 0;
    recordTimerRef.current = setInterval(() => {
      elapsed += 100;
      setRecordProgress(elapsed / 15000);
      if (elapsed >= 15000) stopRecording();
    }, 100);
  };

  const stopRecording = () => {
    clearInterval(recordTimerRef.current);
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setRecordProgress(0);
  };

  const handleCameraPress = () => {
    if (mode === 'photo') takePhoto();
    else { if (isRecording) stopRecording(); else startRecording(); }
  };

  const retake = () => {
    setCapturedMedia(null);
    if (!planIdFromUrl) setSelectedPlan(null);
    setCaption('');
    setPhase(planIdFromUrl ? 'camera' : 'plan_select');
  };

  const postStory = async () => {
    if (!selectedPlan) { toast.error(t.selectPlanFirst); return; }
    if (!capturedMedia?.file) return;
    setIsPosting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: capturedMedia.file });
      await base44.entities.ExperienceStory.create({
        user_id: currentUser.id,
        plan_id: selectedPlan.id,
        challenge_id: challengeIdFromUrl || undefined,
        media_url: file_url,
        media_type: capturedMedia.type,
        caption: caption.trim() || undefined,
        visibility: 'friends',
        moderation_status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      // Increment challenge submissions count
      if (challengeIdFromUrl) {
        const challenges = await base44.entities.CommunityChallenge.filter({ id: challengeIdFromUrl });
        if (challenges[0]) {
          await base44.entities.CommunityChallenge.update(challengeIdFromUrl, {
            submissions_count: (challenges[0].submissions_count || 0) + 1,
          });
        }
      }
      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
      if (profiles[0]) {
        await base44.entities.UserProfile.update(profiles[0].id, {
          total_stories_count: (profiles[0].total_stories_count || 0) + 1,
          current_story_plan_id: selectedPlan.id,
        });
      }
      navigate('/', { replace: true });
    } catch (e) {
      toast.error(t.failedToPostStory);
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      {/* PLAN SELECT PHASE */}
      {phase === 'plan_select' && (
        <div className="flex flex-col h-full" style={{ background: 'var(--bg)', paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
          <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-800">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </motion.button>
            <h1 className="text-white font-bold text-base">{t.postToPlan}</h1>
            <div className="w-10" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {(!currentUser || happeningParticipations.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                <p className="text-5xl">🎉</p>
                <p className="text-white font-semibold text-base">{t.noHappeningPlans}</p>
                <p className="text-gray-500 text-sm px-6">{t.joinPlanToPostStory || 'Junta-te a um plano em curso para partilhar stories.'}</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)}
                  className="px-6 py-2.5 rounded-2xl bg-gray-800 text-gray-300 text-sm font-semibold mt-2">
                  {t.goBack}
                </motion.button>
              </div>
            ) : happeningPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                <p className="text-5xl">⏳</p>
                <p className="text-white font-semibold text-base">{t.noHappeningPlans}</p>
                <p className="text-gray-500 text-sm px-6">{t.joinPlanToPostStory || 'Nenhum plano está em curso de momento.'}</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)}
                  className="px-6 py-2.5 rounded-2xl bg-gray-800 text-gray-300 text-sm font-semibold mt-2">
                  {t.goBack}
                </motion.button>
              </div>
            ) : (
              happeningPlans.map(plan => (
                <motion.button
                  key={plan.id} whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedPlan(plan); setPhase('camera'); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900/60 text-left"
                >
                  {plan.cover_image
                    ? <img src={plan.cover_image} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />
                    : <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00c6d2]/30 to-[#542b9b]/30 flex items-center justify-center text-2xl flex-shrink-0">🎉</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{plan.title}</p>
                    <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{plan.location_address}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-semibold">
                      ● LIVE
                    </span>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>
      )}

      {/* CAMERA PHASE */}
      {phase === 'camera' && (
        <>
          {/* Challenge badge */}
          {challengeIdFromUrl && (
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pointer-events-none"
              style={{ top: 'calc(env(safe-area-inset-top,0px) + 60px)' }}>
              <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center gap-2">
                <span className="text-base">🔥</span>
                <span className="text-white text-xs font-bold">{t.challengePostingFor || 'A postar para o desafio'}</span>
              </div>
            </div>
          )}
          <video
            ref={videoRef} autoPlay playsInline muted disablePictureInPicture
            x-webkit-airplay="deny" controlsList="nodownload nofullscreen noremoteplayback"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />

          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 z-10"
            style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setFlashOn(f => !f)}
                className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${flashOn ? 'bg-yellow-400/80' : 'bg-black/50'}`}>
                {flashOn ? <Zap className="w-5 h-5 text-black" /> : <ZapOff className="w-5 h-5 text-white" />}
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={flipCamera}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

          <div className="absolute left-0 right-0 flex justify-center gap-6 z-10"
            style={{ bottom: 'calc(env(safe-area-inset-bottom,0px) + 110px)' }}>
            {['photo', 'video'].map(m => (
              <motion.button key={m} whileTap={{ scale: 0.95 }} onClick={() => setMode(m)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${mode === m ? 'bg-white text-black' : 'bg-black/40 text-white'}`}>
                {m === 'photo' ? t.photoMode : t.videoMode}
              </motion.button>
            ))}
          </div>

          <div className="absolute left-0 right-0 flex justify-center items-center z-10"
            style={{ bottom: 'calc(env(safe-area-inset-bottom,0px) + 30px)' }}>
            <div className="relative w-24 h-24 flex items-center justify-center">
              {mode === 'video' && isRecording && (
                <svg className="absolute inset-0 w-24 h-24 -rotate-90 pointer-events-none" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                  <circle cx="48" cy="48" r="44" fill="none" stroke="#ff4444" strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 44 * recordProgress} ${2 * Math.PI * 44 * (1 - recordProgress)}`} />
                </svg>
              )}
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleCameraPress}
                className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all relative z-10 ${isRecording ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'}`}>
                {mode === 'photo'
                  ? <div className="w-14 h-14 rounded-full bg-white" />
                  : isRecording
                    ? <div className="w-7 h-7 rounded bg-white" />
                    : <div className="w-14 h-14 rounded-full bg-white" />
                }
              </motion.button>
            </div>
          </div>
        </>
      )}

      {/* PREVIEW PHASE */}
      {phase === 'preview' && capturedMedia && (
        <div className="relative w-full h-full flex flex-col">
          <div className="flex-1 relative overflow-hidden">
            {capturedMedia.type === 'image'
              ? <img src={capturedMedia.url} className="absolute inset-0 w-full h-full object-cover" alt="" />
              : <video src={capturedMedia.url} autoPlay loop muted playsInline disablePictureInPicture
                  x-webkit-airplay="deny" controlsList="nodownload nofullscreen noremoteplayback"
                  className="absolute inset-0 w-full h-full object-cover" />
            }

            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

            <motion.button whileTap={{ scale: 0.9 }} onClick={retake}
              className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-black/60 backdrop-blur-sm"
              style={{ top: 'calc(env(safe-area-inset-top,0px) + 12px)' }}>
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>

            <div className="absolute bottom-28 left-4 right-4 z-20">
              <input
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder={t.addCaption}
                maxLength={120}
                className="w-full bg-black/40 backdrop-blur-md text-white placeholder:text-white/60 rounded-2xl px-4 py-3 outline-none border border-white/20 text-sm"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-safe flex items-center justify-between gap-3"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 20px)' }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowPlanSheet(true)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border backdrop-blur-md transition-all ${
                  selectedPlan ? 'bg-[#00c6d2]/20 border-[#00c6d2]/50' : 'bg-black/50 border-white/20'
                }`}>
                {selectedPlan?.cover_image
                  ? <img src={selectedPlan.cover_image} className="w-6 h-6 rounded-lg object-cover" alt="" />
                  : <MapPin className="w-4 h-4 text-white/80" />
                }
                <span className="text-white text-sm font-medium max-w-[120px] truncate">
                  {selectedPlan ? selectedPlan.title : t.selectPlan}
                </span>
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }} onClick={postStory}
                disabled={!selectedPlan || isPosting}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm disabled:opacity-40 transition-all"
                style={{ background: selectedPlan ? 'linear-gradient(135deg, #00c6d2, #542b9b)' : 'rgba(255,255,255,0.15)' }}>
                {isPosting
                  ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                  : <><Send className="w-4 h-4 text-white" /><span className="text-white">{t.postStory}</span></>
                }
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {showPlanSheet && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 z-40"
                  onClick={() => setShowPlanSheet(false)} />
                <PlanSelectorSheet
                  plans={happeningPlans}
                  selectedPlanId={selectedPlan?.id}
                  onSelect={setSelectedPlan}
                  onClose={() => setShowPlanSheet(false)}
                />
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
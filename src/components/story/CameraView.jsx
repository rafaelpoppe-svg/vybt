import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Zap, ZapOff, X, Video } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

const MAX_VIDEO_SECONDS = 30;

export default function CameraView({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const pressTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const [facingMode, setFacingMode] = useState('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState('photo');
  const { t } = useLanguage();

  const blockPiP = useCallback((el) => {
    if (!el) return;
    el.disablePictureInPicture = true;
    el.setAttribute('disablepictureinpicture', '');
    el.setAttribute('x-webkit-airplay', 'deny');
    el.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
    el.addEventListener('enterpictureinpicture', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
    }, true);
  }, []);

  const startCamera = useCallback(async (facing) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setReady(false);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        blockPiP(videoRef.current);
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError(t.verifyCameraError);
    }
  }, [blockPiP, t]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopRecordingCleanup();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [facingMode]);

  const handleVideoReady = () => {
    if (videoRef.current) blockPiP(videoRef.current);
    setReady(true);
  };

  const flipCamera = () => setFacingMode(f => f === 'environment' ? 'user' : 'environment');

  const takePhoto = () => {
    if (!videoRef.current || capturing || !ready) return;
    setCapturing(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      onCapture(file, 'image');
      setCapturing(false);
    }, 'image/jpeg', 0.92);
  };

  const startRecording = () => {
    if (!streamRef.current || !ready || isRecording) return;
    chunksRef.current = [];

    const mimeType = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || '';
    const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([blob], `video_${Date.now()}.${ext}`, { type: blob.type });
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      onCapture(file, 'video');
    };

    mr.start(100);
    setIsRecording(true);
    setMode('video');

    let elapsed = 0;
    recordingTimerRef.current = setInterval(() => {
      elapsed += 100;
      setRecordingProgress((elapsed / (MAX_VIDEO_SECONDS * 1000)) * 100);
      if (elapsed >= MAX_VIDEO_SECONDS * 1000) stopRecording();
    }, 100);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopRecordingCleanup();
  };

  const stopRecordingCleanup = () => {
    clearInterval(recordingTimerRef.current);
    clearTimeout(pressTimerRef.current);
    setIsRecording(false);
    setRecordingProgress(0);
  };

  const handlePressStart = (e) => {
    e.preventDefault();
    if (!ready) return;
    pressTimerRef.current = setTimeout(() => {
      setMode('video');
      startRecording();
    }, 200);
  };

  const handlePressEnd = (e) => {
    e.preventDefault();
    if (isRecording) {
      stopRecording();
    } else {
      clearTimeout(pressTimerRef.current);
      takePhoto();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="relative flex-1 overflow-hidden bg-black">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <X className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-center text-sm leading-relaxed">{cameraError}</p>
            <button onClick={() => startCamera(facingMode)} className="px-6 py-3 rounded-full bg-[#00c6d2] text-[#0b0b0b] font-bold text-sm">
              {t.cameraRetry}
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            disablePictureInPicture
            x-webkit-airplay="deny"
            controlsList="nodownload nofullscreen noremoteplayback"
            onCanPlay={handleVideoReady}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
        )}

        <AnimatePresence>
          {capturing && (
            <motion.div key="flash" initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-white pointer-events-none z-10" />
          )}
        </AnimatePresence>

        {isRecording && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-semibold">{t.cameraRec}</span>
          </div>
        )}

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <motion.button whileTap={{ scale: 0.85 }} onClick={onClose}
            className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setFlashOn(f => !f)}
            className={`w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${flashOn ? 'bg-yellow-400/90' : 'bg-black/50'}`}>
            {flashOn ? <Zap className="w-5 h-5 text-black" /> : <ZapOff className="w-5 h-5 text-white" />}
          </motion.button>
        </div>
      </div>

      <div className="flex-shrink-0 bg-black flex flex-col items-center gap-3 px-10 pt-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)' }}>

        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ opacity: isRecording ? 1 : 0 }}>
          <motion.div className="h-full bg-red-500 rounded-full" style={{ width: `${recordingProgress}%` }} />
        </div>

        <p className="text-gray-400 text-xs">
          {isRecording ? t.cameraHintRecording : t.cameraHintIdle}
        </p>

        <div className="flex items-center justify-between w-full">
          <div className="w-14 h-14" />

          <motion.button
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            disabled={!ready}
            animate={isRecording ? { scale: 1.15 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="relative w-20 h-20 flex items-center justify-center disabled:opacity-50 select-none"
          >
            <div className={`absolute inset-0 rounded-full border-4 transition-colors ${isRecording ? 'border-red-500' : 'border-white'}`} />
            <div className={`rounded-full transition-all duration-200 ${isRecording ? 'w-8 h-8 bg-red-500 rounded-lg' : 'w-14 h-14 bg-white rounded-full'}`} />
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={flipCamera}
            className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
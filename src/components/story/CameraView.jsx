import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Zap, ZapOff, X, Camera, ImageIcon } from 'lucide-react';

export default function CameraView({ onCapture, onClose, isAdmin = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [facingMode, setFacingMode] = useState('environment');
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState('photo'); // 'photo' | 'video'
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const timerRef = useRef(null);


  const startCamera = useCallback(async (facing) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video'
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError('Could not access camera. Please allow camera permissions.');
    }
  }, [mode]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
    };
  }, [facingMode]);

  const flipCamera = () => {
    setFacingMode(f => f === 'environment' ? 'user' : 'environment');
  };

  const takePhoto = () => {
    if (!videoRef.current || capturing) return;
    setCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (flash) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file, 'image');
      setCapturing(false);
    }, 'image/jpeg', 0.92);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
      onCapture(file, 'video');
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(t => {
        if (t >= 30) { stopRecording(); return t; }
        return t + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleShutter = () => {
    if (mode === 'photo') {
      takePhoto();
    } else {
      if (recording) stopRecording();
      else startRecording();
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Camera feed */}
      <div className="relative flex-1 overflow-hidden">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950">
            <Camera className="w-16 h-16 text-gray-600" />
            <p className="text-gray-400 text-center px-8 text-sm">{cameraError}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="px-6 py-3 rounded-full bg-[#00fea3] text-[#0b0b0b] font-bold text-sm"
            >
              Try Again
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
        )}

        {/* Flash overlay */}
        <AnimatePresence>
          {capturing && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-white pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Recording time */}
        {recording && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-mono font-bold">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>

          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setFlash(f => !f)}
              className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center ${
                flash ? 'bg-yellow-400/90' : 'bg-black/50'
              }`}
            >
              {flash ? <Zap className="w-5 h-5 text-black" /> : <ZapOff className="w-5 h-5 text-white" />}
            </motion.button>
          </div>
        </div>

        {/* Shutter ring pulse on record */}
        {recording && (
          <div className="absolute inset-0 pointer-events-none border-4 border-red-500 rounded-none animate-pulse opacity-30" />
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex-shrink-0 bg-black px-6 pt-5 pb-10 flex flex-col gap-5" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)' }}>
        {/* Mode toggle */}
        <div className="flex items-center justify-center gap-1 bg-white/10 rounded-full p-1 w-48 mx-auto">
          {['photo', 'video'].map((m) => (
            <button
              key={m}
              onClick={() => !recording && setMode(m)}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                mode === m ? 'bg-white text-black' : 'text-white/60'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Shutter row */}
        <div className="flex items-center justify-between">
          {/* Gallery picker (admin only) */}
          {isAdmin ? (
            <label className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center cursor-pointer">
              <ImageIcon className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onCapture(file);
                }}
              />
            </label>
          ) : (
            <div className="w-14 h-14" />
          )}

          {/* Main shutter */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onTouchStart={mode === 'video' && !recording ? () => {} : undefined}
            onClick={handleShutter}
            className="relative w-20 h-20 flex items-center justify-center"
          >
            {/* Outer ring */}
            <div className={`absolute inset-0 rounded-full border-4 transition-all ${
              recording ? 'border-red-500 scale-110' : 'border-white'
            }`} />
            {/* Inner button */}
            <div className={`rounded-full transition-all ${
              recording
                ? 'w-8 h-8 bg-red-500 rounded-lg'
                : mode === 'video'
                ? 'w-14 h-14 bg-red-500'
                : 'w-14 h-14 bg-white'
            }`} />
          </motion.button>

          {/* Flip camera */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={flipCamera}
            disabled={recording}
            className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center disabled:opacity-40"
          >
            <RotateCcw className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </div>


    </div>
  );
}
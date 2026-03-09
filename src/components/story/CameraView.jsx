import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Zap, ZapOff, X } from 'lucide-react';

export default function CameraView({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [ready, setReady] = useState(false);

  const startCamera = useCallback(async (facing) => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setReady(false);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera permissions in Settings.');
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode]);

  const handleVideoReady = () => setReady(true);

  const flipCamera = () => {
    setFacingMode(f => f === 'environment' ? 'user' : 'environment');
  };

  const takePhoto = () => {
    if (!videoRef.current || capturing || !ready) return;
    setCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    // Mirror front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      // Stop stream before handing off
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      onCapture(file);
      setCapturing(false);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Live viewfinder */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <X className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-center text-sm leading-relaxed">{cameraError}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="px-6 py-3 rounded-full bg-[#00c6d2] text-[#0b0b0b] font-bold text-sm"
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
            onCanPlay={handleVideoReady}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
        )}

        {/* Shutter flash overlay */}
        <AnimatePresence>
          {capturing && (
            <motion.div
              key="flash"
              initial={{ opacity: flashOn ? 1 : 0.6 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-white pointer-events-none z-10"
            />
          )}
        </AnimatePresence>

        {/* Top bar: close + flash */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setFlashOn(f => !f)}
            className={`w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
              flashOn ? 'bg-yellow-400/90' : 'bg-black/50'
            }`}
          >
            {flashOn
              ? <Zap className="w-5 h-5 text-black" />
              : <ZapOff className="w-5 h-5 text-white" />
            }
          </motion.button>
        </div>
      </div>

      {/* Bottom shutter bar */}
      <div
        className="flex-shrink-0 bg-black flex items-center justify-between px-10 pt-5"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)' }}
      >
        {/* Spacer (symmetry) */}
        <div className="w-14 h-14" />

        {/* Shutter button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={takePhoto}
          disabled={!ready || capturing}
          className="relative w-20 h-20 flex items-center justify-center disabled:opacity-50"
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-white" />
          {/* Inner disc */}
          <div className="w-14 h-14 rounded-full bg-white" />
        </motion.button>

        {/* Flip camera */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={flipCamera}
          className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
        >
          <RotateCcw className="w-6 h-6 text-white" />
        </motion.button>
      </div>
    </div>
  );
}
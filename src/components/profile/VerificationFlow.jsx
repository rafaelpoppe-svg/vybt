import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../components/common/LanguageContext';

export default function VerificationFlow({ isOpen, onClose, userProfile, onVerificationComplete }) {
  const [step, setStep] = useState(1); // 1: intro, 2: camera, 3: review, 4: processing, 5: success
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const {t} = useLanguage();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Could not access camera. Please allow camera permissions.');
    }
  }, []);

  useEffect(() => {
    if (step === 2) startCamera();
    else stopCamera();
    return () => { if (step !== 2) stopCamera(); };
  }, [step, startCamera, stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStep(1);
      setCapturedImage(null);
      setCapturedBlob(null);
      setError('');
    }
  }, [isOpen, stopCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      setCapturedBlob(blob);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
      setStep(3);
    }, 'image/jpeg', 0.9);
  };

  const handleSubmit = async () => {
    if (!capturedBlob) return;
    setStep(4);
    try {
      const file = new File([capturedBlob], 'verification_selfie.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Use LLM to compare selfie with profile photos
      const profilePhotos = userProfile.photos?.filter(Boolean) || [];
      let isMatch = false;

      if (profilePhotos.length > 0) {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a face verification system. Compare the live selfie (last image) with the profile photos provided. 
          Determine if the person in the selfie is the same person as in the profile photos.
          Be strict but fair - consider lighting differences, angles, and normal appearance changes.
          Return your assessment.`,
          file_urls: [...profilePhotos, file_url],
          response_json_schema: {
            type: 'object',
            properties: {
              is_same_person: { type: 'boolean' },
              confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
              reason: { type: 'string' }
            }
          }
        });
        isMatch = result.is_same_person && result.confidence !== 'low';
      } else {
        // No profile photos — accept selfie as baseline
        isMatch = true;
      }

      if (isMatch) {
        // Mark profile as verified
        await base44.entities.UserProfile.update(userProfile.id, {
          is_verified: true,
          verification_selfie_url: file_url
        });
        setStep(5);
        setTimeout(() => {
          onVerificationComplete();
          onClose();
        }, 2500);
      } else {
        setError('We could not confirm that the selfie matches your profile photos. Make sure you are the same person as in your photos and try again.');
        setStep(3);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setStep(3);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        />

        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className="relative rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md border border-gray-800 overflow-hidden"
          style={{background: 'var(--bg)'}}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-900 z-10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Step 1 — Intro */}
          {step === 1 && (
            <div className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{t.verifyYourProfile}</h2>
              <p className="text-gray-400 text-sm mb-6">
                Take a live selfie to prove you are the same person as in your profile photos. 
                This will give you a <span className="text-blue-400 font-semibold">blue verified badge</span> and build trust with other users.
              </p>

              {userProfile.photos?.filter(Boolean).length > 0 && (
                <div className="flex justify-center gap-2 mb-6">
                  {userProfile.photos.filter(Boolean).slice(0, 3).map((p, i) => (
                    <img key={i} src={p} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-700" />
                  ))}
                </div>
              )}

              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-6 text-left">
                <p className="text-yellow-400 text-xs font-medium mb-1">⚠️ Important</p>
                <p className="text-gray-400 text-xs">
                  You must take a live photo — gallery uploads are not allowed. If you change your profile photos later, your verification will be removed.
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full py-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Verification
              </Button>
            </div>
          )}

          {/* Step 2 — Live Camera */}
          {step === 2 && (
            <div className="p-4 text-center">
              <h2 className="text-xl font-bold text-white mb-3">Take Your Selfie</h2>
              <p className="text-gray-400 text-sm mb-4">Make sure your face is well-lit and clearly visible</p>

              <div className="relative rounded-2xl overflow-hidden bg-gray-900 mb-4" style={{ aspectRatio: '1' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {/* Face guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-56 rounded-full border-2 border-white/30 border-dashed" />
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />

              {error && (
                <p className="text-red-400 text-sm mb-3">{error}</p>
              )}

              <Button
                onClick={capturePhoto}
                className="w-full py-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold"
              >
                <Camera className="w-5 h-5 mr-2" />
                Capture
              </Button>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="p-6 text-center">
              <h2 className="text-xl font-bold text-white mb-4">Review Your Selfie</h2>

              {capturedImage && (
                <div className="relative mb-4">
                  <img
                    src={capturedImage}
                    alt="Selfie"
                    className="w-48 h-48 rounded-2xl object-cover mx-auto border-2 border-blue-500 scale-x-[-1]"
                  />
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm text-left">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => { setError(''); setStep(2); }}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Submit
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 — Processing */}
          {step === 4 && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verifying...</h2>
              <p className="text-gray-400 text-sm">Comparing your selfie with profile photos</p>
            </div>
          )}

          {/* Step 5 — Success */}
          {step === 5 && (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.4 }}
                className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-blue-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Verified! 🎉</h2>
              <p className="text-gray-400">
                Your profile now has a <span className="text-blue-400 font-semibold">blue verified badge</span>.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function VerificationFlow({ isOpen, onClose, userProfile, onVerificationComplete }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState('');

  const handleSelfieUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setSelfieUrl(file_url);
        setStep(2);
      } catch (err) {
        console.error(err);
      }
      setUploading(false);
    }
  };

  const handleVerify = async () => {
    setUploading(true);
    try {
      // Create verification record
      await base44.entities.Verification.create({
        user_id: userProfile.user_id,
        selfie_url: selfieUrl,
        status: 'pending'
      });
      
      setStep(3);
      setTimeout(() => {
        onVerificationComplete();
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-[#0b0b0b] rounded-3xl p-6 w-full max-w-md border border-gray-800"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-900 hover:bg-gray-800 z-10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {step === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[#00fea3]/20 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-[#00fea3]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Verify Your Profile</h2>
              <p className="text-gray-400 mb-6">
                Take a live selfie to verify your identity. Make sure your face is clearly visible and matches your profile photo.
              </p>

              <div className="mb-6 p-4 rounded-xl bg-gray-900">
                <img 
                  src={userProfile.photos?.[0]} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-xl object-cover mx-auto"
                />
                <p className="text-sm text-gray-500 mt-2">Your profile photo</p>
              </div>

              <label>
                <Button
                  disabled={uploading}
                  className="w-full py-6 bg-[#00fea3] text-[#0b0b0b] hover:bg-[#00fea3]/90"
                  asChild
                >
                  <span className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 mr-2" />
                        Take Selfie
                      </>
                    )}
                  </span>
                </Button>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="user"
                  onChange={handleSelfieUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Review Your Selfie</h2>
              
              <div className="mb-6">
                <img 
                  src={selfieUrl} 
                  alt="Selfie" 
                  className="w-48 h-48 rounded-xl object-cover mx-auto border-2 border-[#00fea3]"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-gray-800 text-gray-400"
                >
                  Retake
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={uploading}
                  className="flex-1 bg-[#00fea3] text-[#0b0b0b] hover:bg-[#00fea3]/90"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Submit for Verification'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-full bg-[#00fea3]/20 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-[#00fea3]" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Submitted!</h2>
              <p className="text-gray-400">
                We'll review your verification and update your profile soon.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
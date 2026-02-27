import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, X, AlertCircle, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../common/LanguageContext';

export default function PhotoUploadStep({ photos, onChange }) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [moderationError, setModerationError] = useState('');

  const handlePhotoUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      setModerationError('');
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        // Moderate the image before accepting it
        const result = await base44.functions.invoke('moderateImage', {
          image_url: file_url,
          context: 'profile_photo'
        });

        if (!result.data.approved) {
          setModerationError(result.data.reason || 'This photo is not allowed. Please use a real photo of yourself.');
          setUploading(false);
          return;
        }

        const newPhotos = [...photos];
        newPhotos[index] = file_url;
        onChange(newPhotos);
      } catch (err) {
        console.error(err);
      }
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos[index] = '';
    onChange(newPhotos.filter(p => p));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#00fea3]/20 flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-[#00fea3]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Add your photos</h2>
        <p className="text-gray-400">At least 1 photo is required (first photo for verification)</p>
      </div>

      <div className="flex gap-3 justify-center mb-4">
        {[0, 1, 2].map((i) => (
          <label key={i} className="relative">
            <div className={`${i === 0 ? 'w-32 h-32' : 'w-24 h-24'} rounded-xl overflow-hidden cursor-pointer ${
              photos[i] ? '' : 'bg-gray-800 border-2 border-dashed border-gray-700'
            }`}>
              {photos[i] ? (
                <>
                  <img 
                    src={photos[i]} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removePhoto(i);
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-gray-600" />
                  )}
                </div>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handlePhotoUpload(e, i)} 
              className="hidden" 
            />
            <span className="text-[10px] text-gray-500 absolute -bottom-5 left-0 right-0 text-center">
              {i === 0 ? 'Main (Required)' : `Photo ${i + 1}`}
            </span>
          </label>
        ))}
      </div>

      {moderationError ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
        >
          <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{moderationError}</p>
        </motion.div>
      ) : photos.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-yellow-400 text-sm">
            Your first photo will be used for profile verification. Make sure it clearly shows your face.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
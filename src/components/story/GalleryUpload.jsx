import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, Video } from 'lucide-react';

export default function GalleryUpload({ onFileSelect, isLoading }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (isVideo || isImage) {
        onFileSelect(file);
      }
    }
  };

  return (
    <div className="px-4 pt-4 pb-2">
      <p className="text-gray-400 text-sm mb-4">Select media from gallery</p>
      
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="w-full p-8 rounded-2xl border-2 border-dashed border-gray-700 hover:border-[#00c6d2] transition-colors disabled:opacity-50 flex flex-col items-center gap-3"
      >
        <Upload className="w-8 h-8 text-gray-500" />
        <div className="text-center">
          <p className="text-white font-medium text-sm">Tap to select media</p>
          <p className="text-gray-500 text-xs mt-1">Image or video</p>
        </div>
      </motion.button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading}
      />
    </div>
  );
}
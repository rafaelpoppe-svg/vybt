import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sticker, Plus, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function StickerPicker({ isOpen, onClose, onSelect, userId }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: stickers = [] } = useQuery({
    queryKey: ['stickers', userId],
    queryFn: async () => {
      const myStickers = await base44.entities.Sticker.filter({ user_id: userId });
      const publicStickers = await base44.entities.Sticker.filter({ is_public: true });
      return [...myStickers, ...publicStickers.filter(s => s.user_id !== userId)];
    },
    enabled: isOpen && !!userId
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Sticker.create({
        user_id: userId,
        image_url: file_url,
        name: file.name.split('.')[0],
        is_public: false
      });
      queryClient.invalidateQueries(['stickers', userId]);
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
        <div className="fixed inset-0 z-50" style={{ zIndex: 99 }} onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 overflow-y-auto"
          style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))', zIndex: 100, maxHeight: '260px' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium flex items-center gap-2">
              <Sticker className="w-4 h-4" />
              Stickers
            </h4>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* Add sticker button */}
            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-gray-600 transition-colors">
              {uploading ? (
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
              ) : (
                <Plus className="w-5 h-5 text-gray-500" />
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleUpload} 
                className="hidden" 
              />
            </label>

            {/* Stickers grid */}
            {stickers.map((sticker) => (
              <motion.button
                key={sticker.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onSelect(sticker);
                  onClose();
                }}
                className="aspect-square rounded-xl bg-gray-800 overflow-hidden hover:ring-2 hover:ring-[#00fea3] transition-all"
              >
                <img 
                  src={sticker.image_url} 
                  alt={sticker.name}
                  className="w-full h-full object-contain p-1"
                />
              </motion.button>
            ))}
          </div>

          {stickers.length === 0 && !uploading && (
            <p className="text-gray-500 text-sm text-center py-4">
              {t.noStickersYet}
            </p>
          )}
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
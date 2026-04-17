import React, { useState } from 'react';
import { useLanguage } from '../common/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Play, Loader2, X } from 'lucide-react';

export default function GroupChatGalleryTab({ 
  stories = [], 
  profilesMap = {},
  onClose 
}) {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const { t } = useLanguage();

  const handleDownload = async (story) => {
    try {
      setDownloadingId(story.id);
      const link = document.createElement('a');
      link.href = story.media_url;
      link.download = `vybt-memory-${story.id}.${story.media_type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div 
      className="flex flex-col h-full"
      style={{background: 'var(--bg)'}}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/40 flex-shrink-0">
        <h2 className="text-white font-bold text-lg">{t.gallery}</h2>
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center -mr-2 text-gray-400 active:text-white transition-colors touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            <X className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span className="text-4xl">📷</span>
            <p className="text-gray-500 text-sm">{t.noSharedMemories}</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-3 pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {stories.map((story, idx) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-900 aspect-square"
              >
                {/* Media */}
                <img
                  src={story.media_type === 'video' && story.thumbnail_url ? story.thumbnail_url : story.media_url}
                  alt=""
                  onClick={() => setSelectedMedia(story)}
                  className="w-full h-full object-cover"
                />

                {/* Overlay */}
                <div
                  onClick={() => setSelectedMedia(story)}
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center"
                >
                  {story.media_type === 'video' && (
                    <div className="bg-black/60 rounded-full p-2">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs truncate font-medium">
                    {profilesMap[story.user_id]?.display_name || t.user}
                  </p>
                  <p className="text-gray-400 text-[10px]">
                    {new Date(story.created_date).toLocaleDateString('pt-PT')}
                  </p>
                </div>

                {/* Download Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(story);
                  }}
                  disabled={downloadingId === story.id}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50"
                >
                  {downloadingId === story.id ? (
                    <Loader2 className="w-4 h-4 text-[#00fea3] animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-[#00fea3]" />
                  )}
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setSelectedMedia(null)}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="absolute top-4 left-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(selectedMedia);
                }}
                disabled={downloadingId === selectedMedia.id}
                className="bg-[#00fea3] text-black rounded-lg px-4 py-2 font-semibold text-sm flex items-center gap-2 hover:bg-[#00d4ff] transition-colors disabled:opacity-50"
              >
                {downloadingId === selectedMedia.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.downloading}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {t.download}
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
              {selectedMedia.media_type === 'video' ? (
                <video
                  src={selectedMedia.media_url}
                  controls
                  className="max-w-[90vw] max-h-[80vh] rounded-xl"
                  autoPlay
                  playsInline
                  disablePictureInPicture
                  x-webkit-airplay="deny"
                  controlsList="nodownload nofullscreen noremoteplayback"
                />
              ) : (
                <img
                  src={selectedMedia.media_url}
                  alt=""
                  className="max-w-[90vw] max-h-[80vh] rounded-xl object-contain"
                />
              )}
              <div className="text-center">
                <p className="text-white font-semibold">
                  {profilesMap[selectedMedia.user_id]?.display_name || t.user}
                </p>
                <p className="text-gray-400 text-sm">
                  {new Date(selectedMedia.created_date).toLocaleDateString('pt-PT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
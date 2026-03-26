import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sticker, Lock } from 'lucide-react';
import StickerPicker from './StickerPicker';
import { useLanguage } from '../common/LanguageContext';

export default function GroupChatInput({ isChatLocked, isPending, themeColor = '#00c6d2', userId, onSend }) {
  const [message, setMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [sending, setSending] = useState(false);
  const { t } = useLanguage();

  const handleSend = async () => {
    const trimmed = message.trim();
    if (trimmed && !isPending && !sending) {
      setSending(true);
      setMessage('');
      onSend(trimmed);
      setTimeout(() => setSending(false), 400);
    }
  };

  if (isChatLocked) {
    return (
      <div 
        className="px-4 py-4 border-t border-gray-800/50 backdrop-blur-xl"
        style={{background: 'var(--bg)', opacity: 0.9}}
      >
        <div className="flex items-center justify-center gap-2 text-gray-500 py-1">
          <Lock className="w-4 h-4" />
          <span className="text-sm">{t.chatLocked}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative border-t border-gray-800/50 backdrop-blur-xl"
      style={{background: 'var(--bg)', opacity: 0.9}}
    >
      <StickerPicker
        isOpen={showStickers}
        onClose={() => setShowStickers(false)}
        onSelect={(sticker) => {
          if (!isPending) {
            onSend(`sticker:${sticker.image_url}`);
            setShowStickers(false);
          }
        }}
        userId={userId}
      />

      <div className="flex items-center gap-2 px-3 py-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowStickers(!showStickers)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
            showStickers ? 'bg-[#00c6d2]/20' : 'bg-gray-900'
          }`}
        >
          <Sticker className={`w-5 h-5 ${showStickers ? 'text-[#00c6d2]' : 'text-gray-400'}`} />
        </motion.button>

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.messagePlaceholder}
          className="flex-1 bg-gray-900 border border-gray-700/50 text-white placeholder:text-gray-500 rounded-2xl h-11 px-4 outline-none focus:border-gray-600 transition-colors"
          style={{ fontSize: '16px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <motion.button
          whileTap={{ scale: 0.85 }}
          animate={sending ? { scale: [1, 1.25, 0.9, 1], rotate: [0, -15, 5, 0] } : {}}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          onClick={handleSend}
          disabled={!message.trim() || isPending}
          className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0 relative overflow-hidden"
          style={{ backgroundColor: themeColor }}
        >
          {/* Ripple on send */}
          <AnimatePresence>
            {sending && (
              <motion.span
                key="ripple"
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: themeColor }}
              />
            )}
          </AnimatePresence>
          <Send className="w-5 h-5 text-[#0b0b0b] relative z-10" />
        </motion.button>
      </div>
    </div>
  );
}
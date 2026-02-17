import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sticker, Lock } from 'lucide-react';
import StickerPicker from './StickerPicker';

export default function GroupChatInput({ isChatLocked, isPending, themeColor = '#00fea3', userId, onSend }) {
  const [message, setMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !isPending) {
      onSend(trimmed);
      setMessage('');
    }
  };

  if (isChatLocked) {
    return (
      <div className="px-4 py-4 border-t border-gray-800/50 bg-[#0b0b0b]/90 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-2 text-gray-500 py-1">
          <Lock className="w-4 h-4" />
          <span className="text-sm">Chat bloqueado durante a votação</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border-t border-gray-800/50 bg-[#0b0b0b]/90 backdrop-blur-xl">
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

      <div className="flex items-center gap-2 px-3 py-3 pb-safe">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowStickers(!showStickers)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
            showStickers ? 'bg-[#00fea3]/20' : 'bg-gray-900'
          }`}
        >
          <Sticker className={`w-5 h-5 ${showStickers ? 'text-[#00fea3]' : 'text-gray-400'}`} />
        </motion.button>

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensagem..."
          className="flex-1 bg-gray-900 border border-gray-700/50 text-white placeholder:text-gray-500 rounded-2xl h-11 px-4 text-sm outline-none focus:border-gray-600 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!message.trim() || isPending}
          className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
          style={{ backgroundColor: themeColor }}
        >
          <Send className="w-4 h-4 text-[#0b0b0b]" />
        </motion.button>
      </div>
    </div>
  );
}
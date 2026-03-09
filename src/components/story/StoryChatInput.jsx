import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function StoryChatInput({ storyId, storyUser, onMessageSent, onClose }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendChat = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      // Create direct chat message
      await base44.entities.ChatMessage.create({
        sender_id: (await base44.auth.me()).id,
        receiver_id: storyUser.user_id,
        message_type: 'direct',
        content: message
      });

      setMessage('');
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent rounded-t-3xl"
      >
        <div className="max-w-md mx-auto">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-gray-400">Reply to {storyUser?.display_name}</p>
            <button onClick={onClose} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendChat()}
              placeholder="Send a message..."
              maxLength={200}
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00c6d2]"
              disabled={sending}
              autoFocus
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSendChat}
              disabled={!message.trim() || sending}
              className="p-3 rounded-full bg-[#00c6d2] text-black disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
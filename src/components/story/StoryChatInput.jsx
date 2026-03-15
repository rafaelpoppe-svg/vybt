import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function StoryChatInput({ story, storyUser, onMessageSent, onClose }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const inputRef = useRef(null);

  // Rise above keyboard using visualViewport API
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardOffset(Math.max(0, offset));
    };

    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();

    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  // Auto-focus after mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSendChat = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const me = await base44.auth.me();

      // Build content with story reply prefix so Chat can render it
      const storyRef = story?.media_url
        ? `story_reply:${story.id}:${story.media_url}:${story.media_type || 'image'}`
        : null;

      const content = storyRef ? `${storyRef}\n${message.trim()}` : message.trim();

      await base44.entities.ChatMessage.create({
        sender_id: me.id,
        receiver_id: storyUser.user_id,
        message_type: 'direct',
        content,
        is_read: false,
      });

      setMessage('');
      onMessageSent?.();
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed left-0 right-0 z-[100] px-4 pb-3"
      style={{ bottom: keyboardOffset }}
    >
      {/* Story preview thumbnail */}
      {story?.media_url && (
        <div className="mb-2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
          {story.media_type === 'video'
            ? <video src={story.media_url} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" muted playsInline />
            : <img src={story.media_url} alt="" className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />}
          <div className="min-w-0">
            <p className="text-gray-400 text-xs">Replying to story</p>
            <p className="text-white text-xs font-medium truncate">{storyUser?.display_name}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2 bg-[#0b0b0b]/95 backdrop-blur-xl rounded-2xl border border-white/10 p-2">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !sending && handleSendChat()}
          placeholder={`Message ${storyUser?.display_name || ''}...`}
          maxLength={200}
          style={{ fontSize: '16px' }}
          className="flex-1 bg-transparent text-white placeholder-gray-500 px-3 py-2 outline-none"
          disabled={sending}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSendChat}
          disabled={!message.trim() || sending}
          className="p-2.5 rounded-xl bg-[#00c6d2] text-black disabled:opacity-40 flex items-center justify-center flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
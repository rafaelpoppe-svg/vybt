import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Lock } from 'lucide-react';

export default function CommunityChat({ communityId, community, currentUser, isMember, themeColor }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const bottomRef = useRef(null);
  const tc = themeColor || '#00c6d2';

  const { data: messages = [] } = useQuery({
    queryKey: ['communityChat', communityId],
    queryFn: () => base44.entities.ChatMessage.filter({ plan_id: communityId, message_type: 'group' }, '-created_date', 60),
    refetchInterval: 4000,
    enabled: !!communityId,
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
  });

  const profilesMap = userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});
  const sorted = [...messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: () => base44.entities.ChatMessage.create({
      sender_id: currentUser.id, plan_id: communityId,
      message_type: 'group', content: message.trim(), is_read: false,
    }),
    onSuccess: () => { setMessage(''); queryClient.invalidateQueries(['communityChat', communityId]); },
  });

  const handleSend = () => {
    if (!message.trim() || !currentUser) return;
    sendMutation.mutate();
  };

  if (community?.chat_locked && !isMember) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Lock className="w-10 h-10 text-gray-600" />
        <p className="text-gray-500 text-center">Join the community to participate in the chat 💬</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: '55vh' }}>
      {community?.chat_locked && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-sm" style={{ background: `${tc}20`, color: tc }}>
          <Lock className="w-4 h-4" /> Chat is restricted to members only
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-3 pr-1">
        {sorted.length === 0 && (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-gray-600 text-sm">Be the first to say something! 🎉</p>
          </div>
        )}
        {sorted.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          const sender = profilesMap[msg.sender_id];
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gray-800">
                  {sender?.photos?.[0]
                    ? <img src={sender.photos[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ background: tc }}>{sender?.display_name?.[0] || '?'}</div>}
                </div>
              )}
              <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {!isMe && <p className="text-xs text-gray-500 px-1">{sender?.display_name || 'User'}</p>}
                <div className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={isMe
                    ? { background: '#374151', color: '#fff', borderBottomRightRadius: 4 }
                    : { background: `${tc}35`, color: '#fff', borderBottomLeftRadius: 4 }}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isMember ? (
        <div className="flex gap-2 pt-3 border-t border-gray-800">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Say something... 🎉"
            className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none"
            style={{ fontSize: '16px' }}
          />
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={!message.trim()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${tc}, #542b9b)` }}>
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      ) : (
        <div className="pt-3 border-t border-gray-800 text-center text-gray-600 text-sm py-3">
          Join the community to chat 💬
        </div>
      )}
    </div>
  );
}
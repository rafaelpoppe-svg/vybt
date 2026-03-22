import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function InviteToPlanModal({ plan, friends, profilesMap, currentUser, participantIds, onClose }) {
  const [sent, setSent] = useState({});
  const [sending, setSending] = useState({});

  const eligibleFriends = friends.filter(f => !participantIds.has(f));

  const handleSend = async (friendId) => {
    setSending(prev => ({ ...prev, [friendId]: true }));
    await base44.entities.ChatMessage.create({
      sender_id: currentUser.id,
      receiver_id: friendId,
      message_type: 'direct',
      content: `plan_invite:${plan.id}`,
      is_read: false,
    });
    setSending(prev => ({ ...prev, [friendId]: false }));
    setSent(prev => ({ ...prev, [friendId]: true }));
  };

  const themeColor = plan?.theme_color || '#00c6d2';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="w-full max-w-lg bg-gray-900 rounded-t-3xl border-t border-gray-800"
        style={{ maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-black text-white">Invite Friends 🎉</h2>
            <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[220px]">{plan?.title}</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Friends list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {eligibleFriends.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              {friends.length === 0 ? 'No friends to invite yet' : 'All friends are already in this plan'}
            </div>
          )}
          {eligibleFriends.map(friendId => {
            const profile = profilesMap[friendId];
            if (!profile) return null;
            const isSent = sent[friendId];
            const isSending = sending[friendId];
            return (
              <div key={friendId} className="flex items-center justify-between py-2 px-3 rounded-2xl bg-gray-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: `1.5px solid ${themeColor}66` }}>
                    {profile.photos?.[0]
                      ? <img src={profile.photos[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: themeColor }}>
                          {profile.display_name?.[0] || '?'}
                        </div>}
                  </div>
                  <p className="text-white font-semibold text-sm">{profile.display_name}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => !isSent && handleSend(friendId)}
                  disabled={isSending || isSent}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                  style={isSent
                    ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
                    : { background: `${themeColor}25`, color: themeColor, border: `1px solid ${themeColor}44` }
                  }
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                   isSent ? <><Check className="w-3.5 h-3.5" /> Sent</> :
                   <><Send className="w-3.5 h-3.5" /> Invite</>}
                </motion.button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
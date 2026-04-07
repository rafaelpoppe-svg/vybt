import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../common/LanguageContext';

export default function InviteToCommunityModal({ community, friends, profilesMap, currentUser, onClose }) {
  const { t } = useLanguage();
  const [sent, setSent] = useState({});
  const [sending, setSending] = useState({});

  const handleSend = async (friendId) => {
    setSending(prev => ({ ...prev, [friendId]: true }));
    const msg = `community_invite:${community.id}`;
    await base44.entities.ChatMessage.create({
      sender_id: currentUser.id,
      receiver_id: friendId,
      message_type: 'direct',
      content: msg,
    });
    setSending(prev => ({ ...prev, [friendId]: false }));
    setSent(prev => ({ ...prev, [friendId]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="w-full max-w-lg bg-gray-900 rounded-t-3xl border-t border-gray-800"
        style={{ maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-black text-white">{t.inviteFriendsCommunity} 🏘️</h2>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Friends list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {friends.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">{t.noFriendsToInvite}</div>
          )}
          {friends.map(friendId => {
            const profile = profilesMap[friendId];
            if (!profile) return null;
            const isSent = sent[friendId];
            const isSending = sending[friendId];
            return (
              <div key={friendId} className="flex items-center justify-between py-2 px-3 rounded-2xl bg-gray-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: `1.5px solid ${community.theme_color || '#00c6d2'}66` }}>
                    {profile.photos?.[0]
                      ? <img src={profile.photos[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: community.theme_color || '#00c6d2' }}>
                          {profile.display_name?.[0] || '?'}
                        </div>}
                  </div>
                  <p className="text-white font-semibold text-sm">{profile.display_name}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => !isSent && handleSend(friendId)}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  style={isSent
                    ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
                    : { background: `${community.theme_color || '#00c6d2'}25`, color: community.theme_color || '#00c6d2', border: `1px solid ${community.theme_color || '#00c6d2'}44` }
                  }
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                   isSent ? <><Check className="w-3.5 h-3.5" /> {t.sent}</> :
                   <><Send className="w-3.5 h-3.5" /> {t.invite}</>}
                </motion.button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
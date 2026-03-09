import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, ChevronLeft, Loader2, Sticker, MessageCircle } from 'lucide-react';
import BottomNav from '../components/common/BottomNav';
import ChatMessage from '../components/chat/ChatMessage';
import StickerPicker from '../components/chat/StickerPicker';
import PartyTag from '../components/common/PartyTag';
import { notifyNewDirectMessage } from '../components/notifications/NotificationTriggers';

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const directUserId = urlParams.get('userId');
  const groupPlanId = urlParams.get('planId');

  // If opened with planId param → redirect to GroupChat
  useEffect(() => {
    if (groupPlanId) {
      navigate(createPageUrl('GroupChat') + `?planId=${groupPlanId}`, { replace: true });
    }
  }, [groupPlanId]);

  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('groups');
  const [selectedFriendId, setSelectedFriendId] = useState(directUserId || null);
  const [newMessage, setNewMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles?.[0]) setMyProfile(profiles[0]);
      } catch (e) {}
    };
    getUser();
  }, []);

  // Group messages (for unread count on plan cards)
  const { data: allGroupMessages = [] } = useQuery({
    queryKey: ['allGroupMessages', currentUser?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ message_type: 'group' }),
    enabled: !!currentUser?.id,
    staleTime: 0,
  });

  // Plans (for group list)
  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id,
  });
  const { data: plans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 50),
  });
  const myPlanIds = myParticipations.map(p => p.plan_id);
  const myPlans = plans.filter(p => myPlanIds.includes(p.id));

  // Friends (for DM list)
  const { data: friendships = [] } = useQuery({
    queryKey: ['myFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id,
  });
  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
  });
  const profilesMap = userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});
  const selectedFriendProfile = profilesMap[selectedFriendId];

  // All DMs for list previews
  const { data: allDMMessages = [] } = useQuery({
    queryKey: ['allDMMessages', currentUser?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ message_type: 'direct' }),
    enabled: !!currentUser?.id,
    staleTime: 0,
  });

  // DM Messages for active chat
  const { data: dmMessages = [], isLoading: dmLoading } = useQuery({
    queryKey: ['dmMessages', selectedFriendId, currentUser?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ message_type: 'direct' }),
    enabled: !!selectedFriendId && !!currentUser?.id,
    staleTime: 0,
  });
  const sortedDMs = [...dmMessages]
    .filter(m =>
      (m.sender_id === currentUser?.id && m.receiver_id === selectedFriendId) ||
      (m.sender_id === selectedFriendId && m.receiver_id === currentUser?.id)
    )
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  // Real-time DM subscription
  useEffect(() => {
    if (!selectedFriendId || !currentUser?.id) return;
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create' && event.data.message_type === 'direct') {
        const { sender_id, receiver_id } = event.data;
        if (
          (sender_id === selectedFriendId && receiver_id === currentUser.id) ||
          (sender_id === currentUser.id && receiver_id === selectedFriendId)
        ) {
          queryClient.invalidateQueries(['dmMessages', selectedFriendId, currentUser.id]);
        }
      }
    });
    return () => unsubscribe();
  }, [selectedFriendId, currentUser?.id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedDMs.length]);

  const sendDMMutation = useMutation({
    mutationFn: async (content) => {
      if (!currentUser?.id || !selectedFriendId) return;
      await base44.entities.ChatMessage.create({
        sender_id: currentUser.id,
        receiver_id: selectedFriendId,
        message_type: 'direct',
        content,
        is_read: false,
      });
      await notifyNewDirectMessage(
        selectedFriendId,
        currentUser.id,
        myProfile?.display_name || currentUser.full_name || 'Alguém'
      );
    },
    onSuccess: () => setNewMessage(''),
  });

  // ── DM Chat View ─────────────────────────────────────────────────────────
  if (selectedFriendId) {
    return (
      <div className="flex flex-col bg-[#0b0b0b]" style={{ height: '100dvh' }}>
        {/* Header */}
        <header className="flex-shrink-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-xl border-b border-gray-800/50 px-4 pb-3 flex items-center gap-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedFriendId(null)}
            className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(createPageUrl('UserProfile') + `?id=${selectedFriendId}`)}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#00c6d2]/40 flex-shrink-0">
              {selectedFriendProfile?.photos?.[0] ? (
                <img src={selectedFriendProfile.photos[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00c6d2] flex items-center justify-center">
                  <span className="text-white font-bold">{selectedFriendProfile?.display_name?.[0] || '?'}</span>
                </div>
              )}
              {/* Online dot */}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0b0b0b]" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-white font-semibold text-sm truncate">{selectedFriendProfile?.display_name || 'User'}</p>
              {selectedFriendProfile?.city && (
                <p className="text-[#00c6d2] text-xs truncate">📍 {selectedFriendProfile.city}</p>
              )}
            </div>
          </motion.button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
          {dmLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#00c6d2] animate-spin" />
            </div>
          ) : sortedDMs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#542b9b]/30 to-[#00c6d2]/30 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-[#00c6d2]" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 font-medium text-sm">Inicia uma conversa com</p>
                <p className="text-[#00c6d2] font-bold">{selectedFriendProfile?.display_name || 'User'} 👋</p>
              </div>
            </div>
          ) : (
            sortedDMs.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isMe={msg.sender_id === currentUser?.id}
                sender={msg.sender_id === currentUser?.id
                  ? (myProfile || { display_name: currentUser?.full_name, photos: [] })
                  : selectedFriendProfile}
                showProfile={true}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="relative border-t border-gray-800/50 bg-[#0b0b0b]/90 backdrop-blur-xl">
          <StickerPicker
            isOpen={showStickers}
            onClose={() => setShowStickers(false)}
            onSelect={(sticker) => {
              sendDMMutation.mutate(`sticker:${sticker.image_url}`);
              setShowStickers(false);
            }}
            userId={currentUser?.id}
          />
          <div className="flex items-center gap-2 px-3 py-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowStickers(!showStickers)}
              className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0"
            >
              <Sticker className="w-5 h-5 text-gray-400" />
            </motion.button>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mensagem..."
              className="flex-1 bg-gray-900 border border-gray-700/50 text-white placeholder:text-gray-500 rounded-2xl h-11 px-4 outline-none focus:border-gray-600 transition-colors"
              style={{ fontSize: '16px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newMessage.trim()) {
                  sendDMMutation.mutate(newMessage);
                }
              }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => newMessage.trim() && sendDMMutation.mutate(newMessage)}
              disabled={!newMessage.trim() || sendDMMutation.isPending}
              className="w-10 h-10 rounded-full bg-[#00c6d2] flex items-center justify-center disabled:opacity-40 flex-shrink-0"
            >
              <Send className="w-4 h-4 text-[#0b0b0b]" />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat List ─────────────────────────────────────────────────────────────
  const totalUnreadDMs = friendships.reduce((acc, f) => {
    return acc + allDMMessages.filter(m => m.sender_id === f.friend_id && m.receiver_id === currentUser?.id && !m.is_read).length;
  }, 0);
  const totalUnreadGroups = myPlans.reduce((acc, plan) => {
    return acc + allGroupMessages.filter(m => m.plan_id === plan.id && m.sender_id !== currentUser?.id && !m.is_read).length;
  }, 0);

  return (
    <div className="h-screen flex flex-col bg-[#0b0b0b] overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalUnreadDMs + totalUnreadGroups > 0
                ? <span className="text-[#00c6d2] font-medium">{totalUnreadDMs + totalUnreadGroups} não lidas</span>
                : 'Tudo lido ✓'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pt-2 pb-3">
          {[
            { key: 'groups', label: '🎉 Grupos', count: totalUnreadGroups },
            { key: 'direct', label: '💬 Diretas', count: totalUnreadDMs },
          ].map(({ key, label, count }) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all relative overflow-hidden ${
                activeTab === key
                  ? 'text-[#0b0b0b]'
                  : 'bg-gray-900/80 text-gray-400 border border-gray-800'
              }`}
              style={activeTab === key ? { background: 'linear-gradient(135deg, #00c6d2, #542b9b)' } : {}}
            >
              {label}
              {count > 0 && (
                <span className={`ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                  activeTab === key ? 'bg-white/30 text-white' : 'bg-[#00c6d2] text-[#0b0b0b]'
                }`}>{count}</span>
              )}
            </motion.button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 space-y-2.5 pb-28" style={{ WebkitOverflowScrolling: 'touch' }}>
        {activeTab === 'groups' ? (
          myPlans.length > 0 ? (
            myPlans.map((plan, idx) => {
              const planMsgs = allGroupMessages
                .filter(m => m.plan_id === plan.id)
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
              const lastGroupMsg = planMsgs[0];
              const groupUnread = planMsgs.filter(m => m.sender_id !== currentUser?.id && !m.is_read).length;
              const color = plan.theme_color || '#00c6d2';

              return (
                <motion.button
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(createPageUrl('GroupChat') + `?planId=${plan.id}`)}
                  className="w-full rounded-2xl overflow-hidden text-left"
                  style={{ background: 'linear-gradient(135deg, #111 0%, #181818 100%)', border: `1px solid ${color}25` }}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    {/* Plan image */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      {plan.group_image || plan.cover_image ? (
                        <img src={plan.group_image || plan.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl"
                          style={{ background: `linear-gradient(135deg, ${color}60, #542b9b60)` }}>
                          🎉
                        </div>
                      )}
                      {groupUnread > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#00c6d2] text-[#0b0b0b] text-[10px] font-bold flex items-center justify-center px-1">
                          {groupUnread}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-white font-semibold truncate text-sm">{plan.title}</p>
                        {lastGroupMsg && (
                          <span className="text-[10px] text-gray-600 flex-shrink-0 ml-2">
                            {new Date(lastGroupMsg.created_date).toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {lastGroupMsg ? (
                        <p className={`text-xs truncate ${groupUnread > 0 ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
                          {lastGroupMsg.content.startsWith('sticker:') ? '🖼 Sticker' : lastGroupMsg.content}
                        </p>
                      ) : (
                        <div className="flex gap-1 mt-0.5">
                          {plan.tags?.slice(0, 2).map((tag, i) => (
                            <PartyTag key={i} tag={tag} size="sm" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* color accent bottom */}
                  <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${color}, #542b9b)` }} />
                </motion.button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#542b9b]/30 to-[#00c6d2]/30 flex items-center justify-center text-3xl">🎉</div>
              <p className="text-gray-500 text-sm">Junte-se a um plano para ver grupos!</p>
            </div>
          )
        ) : (
          friendships.length > 0 ? (
            friendships.map((f, idx) => {
              const friend = profilesMap[f.friend_id];
              const convoMsgs = allDMMessages.filter(m =>
                (m.sender_id === currentUser?.id && m.receiver_id === f.friend_id) ||
                (m.sender_id === f.friend_id && m.receiver_id === currentUser?.id)
              ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
              const lastMsg = convoMsgs[0];
              const mySentCount = convoMsgs.filter(m => m.sender_id === currentUser?.id && !m.is_read).length;
              const unreadCount = convoMsgs.filter(m => m.sender_id === f.friend_id && !m.is_read).length;
              const isLastMine = lastMsg?.sender_id === currentUser?.id;
              const previewText = lastMsg
                ? lastMsg.content.startsWith('sticker:') ? '🖼 Sticker' : lastMsg.content
                : null;

              return (
                <motion.button
                  key={f.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedFriendId(f.friend_id)}
                  className="w-full rounded-2xl overflow-hidden text-left"
                  style={{
                    background: unreadCount > 0
                      ? 'linear-gradient(135deg, #0d1f20 0%, #111 100%)'
                      : 'linear-gradient(135deg, #111 0%, #181818 100%)',
                    border: unreadCount > 0 ? '1px solid #00c6d230' : '1px solid #ffffff10'
                  }}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    <div className={`relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ${unreadCount > 0 ? 'ring-2 ring-[#00c6d2]' : ''}`}>
                      {friend?.photos?.[0] ? (
                        <img src={friend.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00c6d2] flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{friend?.display_name?.[0] || '?'}</span>
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#00c6d2] text-[#0b0b0b] text-[10px] font-bold flex items-center justify-center px-1">
                          {unreadCount}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`font-semibold truncate text-sm ${unreadCount > 0 ? 'text-white' : 'text-gray-200'}`}>
                          {friend?.display_name || 'User'}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          {lastMsg && (
                            <span className="text-[10px] text-gray-600">
                              {new Date(lastMsg.created_date).toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {mySentCount > 0 && (
                            <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full">✓ {mySentCount}</span>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs truncate ${unreadCount > 0 ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
                        {previewText
                          ? <>{isLastMine && <span className="text-[#00c6d2]">Tu: </span>}{previewText}</>
                          : <span className="italic text-gray-600">Inicia uma conversa 👋</span>
                        }
                      </p>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <div className="h-0.5 bg-gradient-to-r from-[#00c6d2] to-[#542b9b]" />
                  )}
                </motion.button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#542b9b]/30 to-[#00c6d2]/30 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-[#00c6d2]" />
              </div>
              <p className="text-gray-500 text-sm">Adicione amigos para conversar!</p>
            </div>
          )
        )}
      </main>

      <BottomNav />
    </div>
  );

}
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, ChevronLeft, Loader2, Sticker, MessageCircle, MoreVertical, Trash2, Flag, ShieldOff } from 'lucide-react';
import BottomNav from '../components/common/BottomNav';
import ChatMessage from '../components/chat/ChatMessage';
import StickerPicker from '../components/chat/StickerPicker';
import PartyTag from '../components/common/PartyTag';
import { notifyNewDirectMessage } from '../components/notifications/NotificationTriggers';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

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
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const keyboardHeight = useKeyboardHeight();

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

  // Mark incoming messages as read when chat is open
  useEffect(() => {
    if (!selectedFriendId || !currentUser?.id) return;
    const unread = allDMMessages.filter(
      m => m.sender_id === selectedFriendId && m.receiver_id === currentUser.id && !m.is_read
    );
    unread.forEach(m => base44.entities.ChatMessage.update(m.id, { is_read: true }));
    if (unread.length > 0) {
      queryClient.invalidateQueries(['allDMMessages', currentUser.id]);
    }
  }, [selectedFriendId, allDMMessages, currentUser?.id, queryClient]);

  // Real-time DM subscription — inject messages directly into cache (no refetch delay)
  useEffect(() => {
    if (!selectedFriendId || !currentUser?.id) return;
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create' && event.data?.message_type === 'direct') {
        const { sender_id, receiver_id, id } = event.data;
        const isThisConvo =
          (sender_id === selectedFriendId && receiver_id === currentUser.id) ||
          (sender_id === currentUser.id && receiver_id === selectedFriendId);
        if (!isThisConvo) return;

        queryClient.setQueryData(['dmMessages', selectedFriendId, currentUser.id], (old = []) => {
          // Avoid duplicates: remove any optimistic placeholder + skip if real id already exists
          const withoutOptimistic = old.filter(m => !m.id.startsWith('optimistic-'));
          if (withoutOptimistic.some(m => m.id === id)) return old;
          return [...withoutOptimistic, event.data];
        });

        // Mark as read instantly if incoming (we're in the chat)
        if (sender_id === selectedFriendId && receiver_id === currentUser.id) {
          base44.entities.ChatMessage.update(id, { is_read: true });
        }
      }
    });
    return () => unsubscribe();
  }, [selectedFriendId, currentUser?.id, queryClient]);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [sortedDMs.length, keyboardHeight]);

  const sendDMMutation = useMutation({
    mutationFn: async (content) => {
      if (!currentUser?.id || !selectedFriendId) return;
      const msg = await base44.entities.ChatMessage.create({
        sender_id: currentUser.id,
        receiver_id: selectedFriendId,
        message_type: 'direct',
        content,
        is_read: false,
      });
      notifyNewDirectMessage(
        selectedFriendId,
        currentUser.id,
        myProfile?.display_name || currentUser.full_name || 'Alguém'
      );
      return msg;
    },
    onMutate: (content) => {
      // Optimistic update: add message instantly for the sender
      const optimisticMsg = {
        id: `optimistic-${Date.now()}`,
        sender_id: currentUser.id,
        receiver_id: selectedFriendId,
        message_type: 'direct',
        content,
        is_read: false,
        created_date: new Date().toISOString(),
      };
      queryClient.setQueryData(['dmMessages', selectedFriendId, currentUser.id], (old = []) => [...old, optimisticMsg]);
      setNewMessage('');
    },
    onSuccess: (realMsg) => {
      // Replace optimistic message with the real one from the server
      if (realMsg) {
        queryClient.setQueryData(['dmMessages', selectedFriendId, currentUser?.id], (old = []) => {
          const withoutOptimistic = old.filter(m => !m.id.startsWith('optimistic-'));
          if (withoutOptimistic.some(m => m.id === realMsg.id)) return withoutOptimistic;
          return [...withoutOptimistic, realMsg];
        });
      }
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      const msgs = [...dmMessages].filter(m =>
        (m.sender_id === currentUser?.id && m.receiver_id === selectedFriendId) ||
        (m.sender_id === selectedFriendId && m.receiver_id === currentUser?.id)
      );
      await Promise.all(msgs.map(m => base44.entities.ChatMessage.delete(m.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dmMessages', selectedFriendId, currentUser?.id]);
      queryClient.invalidateQueries(['allDMMessages', currentUser?.id]);
      setShowClearConfirm(false);
      setShowChatMenu(false);
    }
  });

  // ── DM Chat View ─────────────────────────────────────────────────────────
  if (selectedFriendId) {
    return (
      <div className="flex flex-col bg-[#0b0b0b]" style={{ height: '100dvh', paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined }}>
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

          {/* Three dots menu */}
          <div className="relative flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowChatMenu(v => !v)}
              className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </motion.button>

            {showChatMenu && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setShowChatMenu(false)} />
                <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl bg-[#1a1a1a] border border-gray-700/50 shadow-2xl overflow-hidden">
                  <button
                    onClick={() => { setShowClearConfirm(true); setShowChatMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                    Clear Chat
                  </button>
                  <div className="h-px bg-gray-800" />
                  <button
                    onClick={() => { navigate(createPageUrl('UserProfile') + `?id=${selectedFriendId}&report=1`); setShowChatMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-orange-400 hover:bg-white/5 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Report User
                  </button>
                  <div className="h-px bg-gray-800" />
                  <button
                    onClick={() => { navigate(createPageUrl('UserProfile') + `?id=${selectedFriendId}&block=1`); setShowChatMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <ShieldOff className="w-4 h-4" />
                    Block User
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Clear Chat Confirmation */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowClearConfirm(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative w-full bg-[#1a1a1a] rounded-t-3xl p-6 pb-10 z-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-6" />
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-white font-bold text-lg">Clear Chat</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6 ml-13">
                Apagar todo o histórico desta conversa? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 rounded-2xl bg-gray-800 text-gray-300 font-semibold text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => clearChatMutation.mutate()}
                  disabled={clearChatMutation.isPending}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {clearChatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apagar tudo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

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
            { key: 'groups', label: '🎉 Groups', count: totalUnreadGroups },
            { key: 'direct', label: '💬 Directs', count: totalUnreadDMs },
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

      <main className="flex-1 overflow-y-auto px-4 space-y-2.5 pb-36" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <div className="w-full h-full rounded-xl overflow-hidden">
                        {plan.group_image || plan.cover_image ? (
                          <img src={plan.group_image || plan.cover_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl"
                            style={{ background: `linear-gradient(135deg, ${color}60, #542b9b60)` }}>
                            🎉
                          </div>
                        )}
                      </div>
                      {groupUnread > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#00c6d2] text-[#0b0b0b] text-[10px] font-bold flex items-center justify-center px-1 z-10">
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
                        {lastGroupMsg.content.startsWith('sticker:') ? '🖼 Sticker'
                          : lastGroupMsg.content.startsWith('community_invite:') ? '🏘️ Community invitation'
                          : lastGroupMsg.content.startsWith('plan_invite:') ? '🎉 Plan invitation'
                          : lastGroupMsg.content}
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
              const unreadCount = convoMsgs.filter(m => m.sender_id === f.friend_id && m.receiver_id === currentUser?.id && !m.is_read).length;
              const isLastMine = lastMsg?.sender_id === currentUser?.id;
              const previewText = lastMsg
                ? lastMsg.content.startsWith('sticker:') ? '🖼 Sticker'
                  : lastMsg.content.startsWith('community_invite:') ? '🏘️ Community invitation'
                  : lastMsg.content.startsWith('plan_invite:') ? '🎉 Plan invitation'
                  : lastMsg.content
                : null;

              return (
                <motion.button
                  key={f.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedFriendId(f.friend_id)}
                  className="w-full text-left flex items-center gap-3.5 px-2 py-3 rounded-2xl active:bg-white/5 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-[58px] h-[58px] rounded-full overflow-hidden ${unreadCount > 0 ? 'ring-2 ring-[#00c6d2] ring-offset-2 ring-offset-[#0b0b0b]' : ''}`}>
                      {friend?.photos?.[0] ? (
                        <img src={friend.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00c6d2] flex items-center justify-center">
                          <span className="text-white font-bold text-xl">{friend?.display_name?.[0] || '?'}</span>
                        </div>
                      )}
                    </div>
                    {/* Online dot */}
                    {(() => {
                      const ls = friend?.last_seen;
                      const isOnline = ls && (Date.now() - new Date(ls).getTime()) < 5 * 60 * 1000;
                      return isOnline ? (
                        <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#0b0b0b] flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`font-${unreadCount > 0 ? 'bold' : 'semibold'} truncate text-[15px] ${unreadCount > 0 ? 'text-white' : 'text-gray-300'}`}>
                        {friend?.display_name || 'User'}
                      </p>
                      {lastMsg && (
                        <span className={`text-[11px] flex-shrink-0 ${unreadCount > 0 ? 'text-[#00c6d2] font-semibold' : 'text-gray-600'}`}>
                          {new Date(lastMsg.created_date).toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-[13px] truncate ${unreadCount > 0 ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                        {previewText
                          ? <>{isLastMine && <span className="text-[#00c6d2] font-semibold">Tu · </span>}{previewText}</>
                          : <span className="italic text-gray-600">Inicia uma conversa 👋</span>
                        }
                      </p>
                      {unreadCount > 0 && (
                        <div className="flex-shrink-0 min-w-[20px] h-5 rounded-full bg-[#00c6d2] text-[#0b0b0b] text-[11px] font-black flex items-center justify-center px-1.5">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
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
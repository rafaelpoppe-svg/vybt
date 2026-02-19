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

  // DM Messages
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
      <div className="flex flex-col h-screen bg-[#0b0b0b]">
        <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 px-4 pt-12 pb-3 flex items-center gap-3">
           <motion.button
             whileTap={{ scale: 0.9 }}
             onClick={() => setSelectedFriendId(null)}
             className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center"
           >
             <ChevronLeft className="w-5 h-5 text-white" />
           </motion.button>
           <motion.button
             whileTap={{ scale: 0.95 }}
             onClick={() => navigate(createPageUrl('UserProfile') + `?id=${selectedFriendId}`)}
             className="w-9 h-9 rounded-full bg-gray-800 overflow-hidden flex-shrink-0 cursor-pointer"
           >
             {selectedFriendProfile?.photos?.[0] ? (
               <img src={selectedFriendProfile.photos[0]} alt="" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center">
                 <span className="text-white font-bold text-sm">
                   {selectedFriendProfile?.display_name?.[0] || '?'}
                 </span>
               </div>
             )}
           </motion.button>
           <motion.button
             whileTap={{ scale: 0.95 }}
             onClick={() => navigate(createPageUrl('UserProfile') + `?id=${selectedFriendId}`)}
             className="text-white font-semibold cursor-pointer hover:opacity-80 transition-opacity flex-1 text-left"
           >
             {selectedFriendProfile?.display_name || 'User'}
           </motion.button>
         </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {dmLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#00fea3] animate-spin" />
            </div>
          ) : sortedDMs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
              <MessageCircle className="w-10 h-10 text-gray-600" />
              <p className="text-gray-500 text-sm">Inicie uma conversa!</p>
            </div>
          ) : (
            sortedDMs.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isMe={msg.sender_id === currentUser?.id}
                sender={msg.sender_id === currentUser?.id ? myProfile : selectedFriendProfile}
                showProfile={false}
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
          <div className="flex items-center gap-2 px-3 py-3">
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
              className="flex-1 bg-gray-900 border border-gray-700/50 text-white placeholder:text-gray-500 rounded-2xl h-11 px-4 text-sm outline-none focus:border-gray-600 transition-colors"
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
              className="w-10 h-10 rounded-full bg-[#00fea3] flex items-center justify-center disabled:opacity-40 flex-shrink-0"
            >
              <Send className="w-4 h-4 text-[#0b0b0b]" />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat List ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-24">
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800">
        <div className="px-4 pt-12 pb-3">
          <h1 className="text-xl font-bold text-white">Messages</h1>
        </div>
        <div className="flex gap-2 px-4 pb-4">
          {[
            { key: 'groups', label: 'Plan Groups' },
            { key: 'direct', label: 'Direct Messages' },
          ].map(({ key, label }) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-[#00fea3] text-[#0b0b0b]'
                  : 'bg-gray-900 text-gray-400 border border-gray-800'
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-2">
        {activeTab === 'groups' ? (
          myPlans.length > 0 ? (
            myPlans.map((plan) => (
              <motion.button
                key={plan.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(createPageUrl('GroupChat') + `?planId=${plan.id}`)}
                className="w-full p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-3 text-left"
                style={{ borderLeftColor: plan.theme_color || '#00fea3', borderLeftWidth: '3px' }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  {plan.group_image ? (
                    <img src={plan.group_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xl"
                      style={{ background: `linear-gradient(135deg, ${plan.theme_color || '#542b9b'}50, #00fea350)` }}
                    >
                      🎉
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{plan.title}</p>
                  <div className="flex gap-1 mt-1 overflow-x-auto scrollbar-hide">
                    {plan.tags?.slice(0, 2).map((tag, i) => (
                      <PartyTag key={i} tag={tag} size="sm" />
                    ))}
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-600 rotate-180 flex-shrink-0" />
              </motion.button>
            ))
          ) : (
            <div className="text-center py-16 opacity-50">
              <span className="text-5xl mb-4 block">🎉</span>
              <p className="text-gray-500">Junte-se a um plano para ver grupos!</p>
            </div>
          )
        ) : (
          friendships.length > 0 ? (
            friendships.map((f) => {
              const friend = profilesMap[f.friend_id];
              return (
                <motion.button
                  key={f.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedFriendId(f.friend_id)}
                  className="w-full p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-3 text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden flex-shrink-0">
                    {friend?.photos?.[0] ? (
                      <img src={friend.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold">{friend?.display_name?.[0] || '?'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{friend?.display_name || 'User'}</p>
                    {friend?.city && <p className="text-gray-500 text-sm truncate">{friend.city}</p>}
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-600 rotate-180 flex-shrink-0" />
                </motion.button>
              );
            })
          ) : (
            <div className="text-center py-16 opacity-50">
              <MessageCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Adicione amigos para conversar!</p>
            </div>
          )
        )}
      </main>

      <BottomNav />
    </div>
  );
}
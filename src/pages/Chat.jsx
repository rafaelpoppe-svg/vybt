import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Send, ChevronLeft, Loader2, Sticker } from 'lucide-react';
import { Input } from '@/components/ui/input';
import BottomNav from '../components/common/BottomNav';
import ChatStoryBar from '../components/chat/ChatStoryBar';
import ChatMessage from '../components/chat/ChatMessage';
import StickerPicker from '../components/chat/StickerPicker';
import PartyTag from '../components/common/PartyTag';

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('planId');
  const userId = urlParams.get('userId');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(planId ? 'groups' : 'direct');
  const [selectedChat, setSelectedChat] = useState(planId || userId || null);
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

  // Fetch user's plans for group chats
  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['myPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 50),
  });

  const myPlanIds = myParticipations.map(p => p.plan_id);
  const myPlans = plans.filter(p => myPlanIds.includes(p.id));

  // Fetch friends for direct messages
  const { data: friendships = [] } = useQuery({
    queryKey: ['myFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
  });

  const profilesMap = userProfiles.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  // Fetch stories for group chat
  const { data: planStories = [] } = useQuery({
    queryKey: ['planStories', selectedChat],
    queryFn: () => base44.entities.ExperienceStory.filter({ plan_id: selectedChat }),
    enabled: !!selectedChat && activeTab === 'groups'
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedChat, activeTab],
    queryFn: () => {
      if (activeTab === 'groups') {
        return base44.entities.ChatMessage.filter({ plan_id: selectedChat, message_type: 'group' });
      } else {
        return base44.entities.ChatMessage.filter({ message_type: 'direct' });
      }
    },
    enabled: !!selectedChat
  });

  const filteredMessages = activeTab === 'direct' 
    ? messages.filter(m => 
        (m.sender_id === currentUser?.id && m.receiver_id === selectedChat) ||
        (m.sender_id === selectedChat && m.receiver_id === currentUser?.id)
      )
    : messages;

  const sortedMessages = [...filteredMessages].sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      await base44.entities.ChatMessage.create({
        sender_id: currentUser.id,
        receiver_id: activeTab === 'direct' ? selectedChat : null,
        plan_id: activeTab === 'groups' ? selectedChat : null,
        message_type: activeTab === 'groups' ? 'group' : 'direct',
        content: content,
        is_read: false
      });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries(['messages', selectedChat, activeTab]);
    }
  });

  const handleSendSticker = (sticker) => {
    sendMutation.mutate(`sticker:${sticker.image_url}`);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedMessages]);

  const selectedPlan = myPlans.find(p => p.id === selectedChat);
  const selectedFriend = profilesMap[selectedChat];

  // Check if plan is currently active (can post stories)
  const isPlanActive = () => {
    if (!selectedPlan) return false;
    const now = new Date();
    const planDateTime = new Date(`${selectedPlan.date}T${selectedPlan.time}`);
    return now >= planDateTime;
  };

  // Get theme color for group chat
  const themeColor = selectedPlan?.theme_color || '#00fea3';

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-24">
      {/* Header */}
      <header 
        className="sticky top-0 z-40 backdrop-blur-lg border-b border-gray-800"
        style={{ 
          backgroundColor: selectedChat && activeTab === 'groups' 
            ? `${themeColor}10` 
            : 'rgba(11, 11, 11, 0.95)'
        }}
      >
        <div className="p-4 flex items-center gap-3">
          {selectedChat ? (
            <>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedChat(null)}
                className="p-2 rounded-full bg-gray-900"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </motion.button>
              
              {activeTab === 'groups' && selectedPlan ? (
                <div className="flex items-center gap-3 flex-1">
                  {/* Group Image */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[#542b9b] to-[#00fea3]/50">
                    {selectedPlan.group_image ? (
                      <img src={selectedPlan.group_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-lg">🎉</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Tags above name */}
                    {selectedPlan.tags?.length > 0 && (
                      <div className="flex gap-1 mb-0.5 overflow-x-auto scrollbar-hide">
                        {selectedPlan.tags.slice(0, 2).map((tag, i) => (
                          <PartyTag key={i} tag={tag} size="sm" />
                        ))}
                      </div>
                    )}
                    <h1 className="text-lg font-bold text-white truncate">{selectedPlan.title}</h1>
                  </div>
                </div>
              ) : (
                <h1 className="text-lg font-bold text-white">
                  {selectedFriend?.display_name}
                </h1>
              )}
            </>
          ) : (
            <h1 className="text-xl font-bold text-white">Messages</h1>
          )}
        </div>

        {/* Tabs */}
        {!selectedChat && (
          <div className="flex gap-2 px-4 pb-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'direct'
                  ? 'bg-[#00fea3] text-[#0b0b0b]'
                  : 'bg-gray-900 text-gray-400 border border-gray-800'
              }`}
            >
              Direct Messages
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'groups'
                  ? 'bg-[#00fea3] text-[#0b0b0b]'
                  : 'bg-gray-900 text-gray-400 border border-gray-800'
              }`}
            >
              Plan Groups
            </motion.button>
          </div>
        )}

        {/* Stories bar in group chat */}
        {selectedChat && activeTab === 'groups' && (
          <div className="py-3 border-t border-gray-800/50">
            <ChatStoryBar
              stories={planStories}
              profilesMap={profilesMap}
              currentUserId={currentUser?.id}
              canPost={isPlanActive()}
              onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
              onAddStory={() => navigate(createPageUrl('AddStory') + `?planId=${selectedChat}`)}
            />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="p-4">
        {!selectedChat ? (
          // Chat List
          <div className="space-y-2">
            {activeTab === 'groups' ? (
              myPlans.length > 0 ? (
                myPlans.map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedChat(plan.id)}
                    className="w-full p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-3 text-left"
                    style={{ borderLeftColor: plan.theme_color || '#00fea3', borderLeftWidth: '3px' }}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden">
                      {plan.group_image ? (
                        <img src={plan.group_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00fea3]/50 flex items-center justify-center">
                          <span className="text-xl">🎉</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{plan.title}</p>
                      <div className="flex gap-1 mt-1">
                        {plan.tags?.slice(0, 2).map((tag, i) => (
                          <PartyTag key={i} tag={tag} size="sm" />
                        ))}
                      </div>
                    </div>
                  </motion.button>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No group chats yet. Join a plan!</p>
              )
            ) : (
              friendships.length > 0 ? (
                friendships.map((f) => {
                  const friend = profilesMap[f.friend_id];
                  return (
                    <motion.button
                      key={f.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedChat(f.friend_id)}
                      className="w-full p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-3 text-left"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                        {friend?.photos?.[0] ? (
                          <img src={friend.photos[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold">{friend?.display_name?.[0] || '?'}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{friend?.display_name || 'User'}</p>
                      </div>
                    </motion.button>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">No conversations yet. Add friends!</p>
              )
            )}
          </div>
        ) : (
          // Chat Messages
          <div className="flex flex-col h-[calc(100vh-280px)]">
            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#00fea3] animate-spin" />
                </div>
              ) : sortedMessages.length > 0 ? (
                sortedMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  const sender = profilesMap[msg.sender_id] || myProfile;
                  return (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isMe={isMe}
                      sender={sender}
                      showProfile={activeTab === 'groups'}
                    />
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">No messages yet</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="relative flex gap-2 pt-2 border-t border-gray-800">
              <StickerPicker
                isOpen={showStickers}
                onClose={() => setShowStickers(false)}
                onSelect={handleSendSticker}
                userId={currentUser?.id}
              />
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowStickers(!showStickers)}
                className="p-3 rounded-full bg-gray-900"
              >
                <Sticker className="w-5 h-5 text-gray-400" />
              </motion.button>
              
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-900 border-gray-800 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newMessage.trim()) {
                    sendMutation.mutate(newMessage);
                  }
                }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => newMessage.trim() && sendMutation.mutate(newMessage)}
                disabled={!newMessage.trim() || sendMutation.isPending}
                className="p-3 rounded-full bg-[#00fea3] disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-[#0b0b0b]" />
              </motion.button>
            </div>
          </div>
        )}
      </main>

      {!selectedChat && <BottomNav />}
    </div>
  );
}
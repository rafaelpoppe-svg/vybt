import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Send, ChevronLeft, Loader2, Sticker, Info, MoreVertical, MapPin, Clock, Lock, Flame, RefreshCw, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import BottomNav from '../components/common/BottomNav';
import ChatStoryBar from '../components/chat/ChatStoryBar';
import ChatMessage from '../components/chat/ChatMessage';
import StickerPicker from '../components/chat/StickerPicker';
import PartyTag from '../components/common/PartyTag';
import GroupAdminActions from '../components/chat/GroupAdminActions';
import PlanCountdown from '../components/plan/PlanCountdown';
import VotingModal from '../components/plan/VotingModal';
import RenewPlanModal from '../components/plan/RenewPlanModal';
import DeletePlanModal from '../components/plan/DeletePlanModal';
import LeavePlanModal from '../components/plan/LeavePlanModal';
import AdminEditModal from '../components/plan/AdminEditModal';

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
  const [showAdminActions, setShowAdminActions] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAdminEditModal, setShowAdminEditModal] = useState(false);
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

  const { data: allParticipants = [] } = useQuery({
    queryKey: ['planAllParticipants', selectedChat],
    queryFn: () => base44.entities.PlanParticipant.filter({ plan_id: selectedChat }),
    enabled: !!selectedChat && activeTab === 'groups'
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

  // Check if current user is admin
  const myParticipation = myParticipations.find(p => p.plan_id === selectedChat);
  const isAdmin = myParticipation?.is_admin || selectedPlan?.creator_id === currentUser?.id;

  // Check plan status
  const getPlanStatus = () => {
    if (!selectedPlan) return 'upcoming';
    const now = new Date();
    const startTime = new Date(`${selectedPlan.date}T${selectedPlan.time}`);
    const endTime = selectedPlan.end_time 
      ? new Date(`${selectedPlan.date}T${selectedPlan.end_time}`)
      : new Date(startTime.getTime() + 6 * 60 * 60 * 1000);
    
    if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
    const votingEnds = new Date(endTime.getTime() + 12 * 60 * 60 * 1000);

    if (now < startTime) return 'upcoming';
    if (now >= startTime && now < endTime) return 'happening';
    if (now >= endTime && now < votingEnds) return 'voting';
    return 'ended';
  };

  const planStatus = selectedChat && activeTab === 'groups' ? getPlanStatus() : 'upcoming';
  const isChatLocked = planStatus === 'voting';
  const hasVoted = selectedPlan?.voted_users?.includes(currentUser?.id);

  // Check if plan is currently active (can post stories)
  const isPlanActive = () => {
    return planStatus === 'happening';
  };

  // Get theme color for group chat
  const themeColor = selectedPlan?.theme_color || '#00fea3';

  // Sort stories - pinned first, then new (unviewed) with light blue
  const sortedStories = [...planStories].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return 0;
  });

  // Admin actions handlers
  const handlePinStory = async (storyId) => {
    await base44.entities.ExperienceStory.update(storyId, { is_pinned: true });
    const currentPinned = selectedPlan.pinned_stories || [];
    await base44.entities.PartyPlan.update(selectedChat, {
      pinned_stories: [...currentPinned, storyId]
    });
    queryClient.invalidateQueries(['planStories', selectedChat]);
  };

  const handleUnpinStory = async (storyId) => {
    await base44.entities.ExperienceStory.update(storyId, { is_pinned: false });
    const currentPinned = selectedPlan.pinned_stories || [];
    await base44.entities.PartyPlan.update(selectedChat, {
      pinned_stories: currentPinned.filter(id => id !== storyId)
    });
    queryClient.invalidateQueries(['planStories', selectedChat]);
  };

  const handlePinMessage = async (messageId) => {
    const currentPinned = selectedPlan.pinned_messages || [];
    await base44.entities.PartyPlan.update(selectedChat, {
      pinned_messages: [...currentPinned, messageId]
    });
    queryClient.invalidateQueries(['plan', selectedChat]);
  };

  const handleUnpinMessage = async (messageId) => {
    const currentPinned = selectedPlan.pinned_messages || [];
    await base44.entities.PartyPlan.update(selectedChat, {
      pinned_messages: currentPinned.filter(id => id !== messageId)
    });
    queryClient.invalidateQueries(['plan', selectedChat]);
  };

  const handleRemoveMember = async (memberId) => {
    const participation = allParticipants.find(p => p.user_id === memberId);
    if (participation) {
      await base44.entities.PlanParticipant.delete(participation.id);
      queryClient.invalidateQueries(['planAllParticipants', selectedChat]);
    }
  };

  const handleInviteUser = async (email) => {
    // For now just show a message - in real app would send invite
    console.log('Invite sent to:', email);
  };

  // Voting mutation
  const voteMutation = useMutation({
    mutationFn: async (vote) => {
      const currentVotedUsers = selectedPlan.voted_users || [];
      const updateData = {
        voted_users: [...currentVotedUsers, currentUser.id]
      };
      if (vote === 'great') {
        updateData.great_votes = (selectedPlan.great_votes || 0) + 1;
      } else {
        updateData.bad_votes = (selectedPlan.bad_votes || 0) + 1;
      }
      await base44.entities.PartyPlan.update(selectedChat, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myPlans']);
      setShowVotingModal(false);
    }
  });

  // Renew mutation
  const renewMutation = useMutation({
    mutationFn: async (renewData) => {
      await base44.entities.PartyPlan.update(selectedChat, {
        ...renewData,
        status: 'renewed',
        great_votes: 0,
        bad_votes: 0,
        voted_users: []
      });
      // Send notification
      await base44.entities.ChatMessage.create({
        sender_id: currentUser.id,
        plan_id: selectedChat,
        message_type: 'group',
        content: '🔄 Let\'s gooo Again! 😎 O plano foi renovado!',
        is_read: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myPlans']);
      queryClient.invalidateQueries(['messages', selectedChat, activeTab]);
      setShowRenewModal(false);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete all participants
      for (const p of allParticipants) {
        await base44.entities.PlanParticipant.delete(p.id);
      }
      // Delete all messages
      for (const m of messages) {
        await base44.entities.ChatMessage.delete(m.id);
      }
      // Delete plan
      await base44.entities.PartyPlan.delete(selectedChat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myPlans']);
      setSelectedChat(null);
      setShowDeleteModal(false);
    }
  });

  // Admin edit mutation
  const adminEditMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.PartyPlan.update(selectedChat, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myPlans']);
      setShowAdminEditModal(false);
    }
  });

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-24">
      {/* Background blur for group chat */}
      {selectedChat && activeTab === 'groups' && selectedPlan?.group_image && (
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${selectedPlan.group_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(50px) brightness(0.3)',
            opacity: 0.75
          }}
        />
      )}

      {/* Header */}
      <header 
        className="sticky top-0 z-40 backdrop-blur-lg border-b border-gray-800 relative"
        style={{ 
          backgroundColor: selectedChat && activeTab === 'groups' 
            ? `${themeColor}15` 
            : 'rgba(11, 11, 11, 0.95)'
        }}
      >
        <div className="p-4 flex items-center gap-3">
          {selectedChat ? (
            <>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedChat(null)}
                className="p-2 rounded-full bg-gray-900/80"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </motion.button>
              
              {activeTab === 'groups' && selectedPlan ? (
                <div className="flex items-center gap-3 flex-1">
                  {/* Group Image */}
                  <div 
                    className="w-10 h-10 rounded-xl overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${themeColor}50, #542b9b50)` }}
                  >
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
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${selectedChat}`)}
                      className="p-2 rounded-full bg-gray-900/80"
                    >
                      <Info className="w-5 h-5 text-white" />
                    </motion.button>
                    {isAdmin && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowAdminActions(true)}
                        className="p-2 rounded-full bg-gray-900/80"
                      >
                        <MoreVertical className="w-5 h-5 text-white" />
                      </motion.button>
                    )}
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

        {/* Plan info bar (time & address) */}
        {selectedChat && activeTab === 'groups' && selectedPlan && (
          <div className="px-4 pb-2 space-y-2">
            {/* Countdown / Status */}
            <PlanCountdown plan={selectedPlan} size="sm" />
            
            <div 
              className="flex items-center gap-4 text-xs"
              style={{ color: themeColor }}
            >
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{selectedPlan.time}{selectedPlan.end_time && ` - ${selectedPlan.end_time}`}</span>
              </div>
              <div className="flex items-center gap-1 flex-1 truncate">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{selectedPlan.location_address}</span>
              </div>
            </div>

            {/* Voting Banner */}
            {isChatLocked && !hasVoted && !isAdmin && (
              <motion.button
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => setShowVotingModal(true)}
                className="w-full py-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4" />
                Votação aberta! Toque para votar
              </motion.button>
            )}

            {/* Admin Actions for ended plan */}
            {planStatus === 'ended' && isAdmin && (
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowRenewModal(true)}
                  className="flex-1 py-2 rounded-lg bg-[#00fea3]/20 border border-[#00fea3]/30 text-[#00fea3] text-sm font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Renovar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteModal(true)}
                  className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </motion.button>
              </div>
            )}
          </div>
        )}

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
              stories={sortedStories}
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
      <main className="p-4 relative z-10">
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
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${plan.theme_color || '#542b9b'}50, #00fea350)` }}
                        >
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
          <div className="flex flex-col h-[calc(100vh-320px)]">
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
              {isChatLocked ? (
                <div className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-500">
                  <Lock className="w-5 h-5" />
                  <span className="text-sm">Chat bloqueado durante votação</span>
                </div>
              ) : (
                <>
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
                    className="p-3 rounded-full disabled:opacity-50"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Send className="w-5 h-5 text-[#0b0b0b]" />
                  </motion.button>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {!selectedChat && <BottomNav />}

      {/* Admin Actions Modal */}
      <GroupAdminActions
        isOpen={showAdminActions}
        onClose={() => setShowAdminActions(false)}
        participants={allParticipants}
        profilesMap={profilesMap}
        stories={planStories}
        messages={sortedMessages}
        pinnedStories={selectedPlan?.pinned_stories || []}
        pinnedMessages={selectedPlan?.pinned_messages || []}
        onPinStory={handlePinStory}
        onUnpinStory={handleUnpinStory}
        onPinMessage={handlePinMessage}
        onUnpinMessage={handleUnpinMessage}
        onRemoveMember={handleRemoveMember}
        onInviteUser={handleInviteUser}
        currentUserId={currentUser?.id}
        isAdmin={isAdmin}
        onEditPlan={() => {
          setShowAdminActions(false);
          setShowAdminEditModal(true);
        }}
      />

      {/* Voting Modal */}
      <VotingModal
        isOpen={showVotingModal}
        onClose={() => setShowVotingModal(false)}
        onVote={(vote) => voteMutation.mutate(vote)}
        planTitle={selectedPlan?.title || ''}
        isLoading={voteMutation.isPending}
      />

      {/* Renew Modal */}
      <RenewPlanModal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        onConfirm={(data) => renewMutation.mutate(data)}
        plan={selectedPlan}
        isLoading={renewMutation.isPending}
      />

      {/* Delete Modal */}
      <DeletePlanModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        planTitle={selectedPlan?.title || ''}
        isLoading={deleteMutation.isPending}
      />

      {/* Leave Modal */}
      <LeavePlanModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={() => {/* handle leave */}}
        planTitle={selectedPlan?.title || ''}
        isLoading={false}
      />

      {/* Admin Edit Modal */}
      <AdminEditModal
        isOpen={showAdminEditModal}
        onClose={() => setShowAdminEditModal(false)}
        plan={selectedPlan}
        onSave={(data) => adminEditMutation.mutate(data)}
        isLoading={adminEditMutation.isPending}
      />
    </div>
  );
}
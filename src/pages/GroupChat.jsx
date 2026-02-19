import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import GroupChatHeader from '../components/chat/GroupChatHeader';
import GroupChatInput from '../components/chat/GroupChatInput';
import GroupMessageBubble from '../components/chat/GroupMessageBubble';
import ChatStoryBar from '../components/chat/ChatStoryBar';
import GroupAdminActions from '../components/chat/GroupAdminActions';
import VotingModal from '../components/plan/VotingModal';
import RenewPlanModal from '../components/plan/RenewPlanModal';
import DeletePlanModal from '../components/plan/DeletePlanModal';
import AdminEditModal from '../components/plan/AdminEditModal';
import { notifyNewGroupMessage } from '../components/notifications/NotificationTriggers';

export default function GroupChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const planId = new URLSearchParams(window.location.search).get('planId');

  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [showAdminActions, setShowAdminActions] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const { data: plans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 50),
  });
  const plan = plans.find(p => p.id === planId);

  const { data: participants = [] } = useQuery({
    queryKey: ['planParticipants', planId],
    queryFn: () => base44.entities.PlanParticipant.filter({ plan_id: planId }),
    enabled: !!planId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['groupMessages', planId],
    queryFn: () => base44.entities.ChatMessage.filter({ plan_id: planId, message_type: 'group' }),
    enabled: !!planId,
    staleTime: 0,
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['planStories', planId],
    queryFn: () => base44.entities.ExperienceStory.filter({ plan_id: planId }),
    enabled: !!planId,
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 200),
  });
  const profilesMap = userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});

  // ── Real-time Subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!planId || !currentUser?.id) return;
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create' && event.data.plan_id === planId) {
        queryClient.invalidateQueries(['groupMessages', planId]);
      }
    });
    return () => unsubscribe();
  }, [planId, currentUser?.id, queryClient]);

  // ── Sorted Messages ────────────────────────────────────────────────────────
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_date) - new Date(b.created_date)
  );

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedMessages.length]);

  // ── Plan Status ────────────────────────────────────────────────────────────
  const myParticipation = participants.find(p => p.user_id === currentUser?.id);
  const isAdmin = myParticipation?.is_admin || plan?.creator_id === currentUser?.id;

  const getPlanStatus = () => {
    if (!plan) return 'upcoming';
    if (plan.status === 'ended') return 'ended';
    if (plan.status === 'renewed') return 'upcoming';
    const now = new Date();
    const startTime = new Date(`${plan.date}T${plan.time}`);
    const endTime = plan.end_time
      ? new Date(`${plan.date}T${plan.end_time}`)
      : new Date(startTime.getTime() + 6 * 60 * 60 * 1000);
    if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
    const votingEnds = new Date(endTime.getTime() + 12 * 60 * 60 * 1000);
    const votedCount = plan.voted_users?.length || 0;
    if (votedCount > 0 && participants.length > 0 && votedCount >= participants.length) return 'ended';
    if (now < startTime) return 'upcoming';
    if (now >= startTime && now < endTime) return 'happening';
    if (now >= endTime && now < votingEnds) return 'voting';
    return 'ended';
  };

  const planStatus = getPlanStatus();
  const isChatLocked = planStatus === 'voting';
  const hasVoted = plan?.voted_users?.includes(currentUser?.id);
  const themeColor = plan?.theme_color || '#00fea3';

  // ── Mutations ──────────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async (content) => {
      if (!currentUser?.id || !planId) return;
      // Fire notification in background — don't await it
      const msgPromise = base44.entities.ChatMessage.create({
        sender_id: currentUser.id,
        plan_id: planId,
        message_type: 'group',
        content,
        is_read: false,
      });
      notifyNewGroupMessage(
        planId, currentUser.id,
        myProfile?.display_name || currentUser.full_name || 'Alguém'
      ); // intentionally not awaited
      return msgPromise;
    },
    onMutate: async (content) => {
      // Cancel any in-flight refetches
      await queryClient.cancelQueries(['groupMessages', planId]);
      // Snapshot current messages
      const previous = queryClient.getQueryData(['groupMessages', planId]);
      // Optimistically add the new message
      const optimisticMsg = {
        id: `optimistic-${Date.now()}`,
        sender_id: currentUser?.id,
        plan_id: planId,
        message_type: 'group',
        content,
        is_read: false,
        created_date: new Date().toISOString(),
      };
      queryClient.setQueryData(['groupMessages', planId], (old = []) => [...old, optimisticMsg]);
      return { previous };
    },
    onError: (_err, _content, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['groupMessages', planId], context.previous);
      }
    },
    onSuccess: () => {
      // Sync with real data after server confirms
      queryClient.invalidateQueries(['groupMessages', planId]);
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (vote) => {
      const currentVotedUsers = plan.voted_users || [];
      const newVotedUsers = [...currentVotedUsers, currentUser.id];
      const updateData = {
        voted_users: newVotedUsers,
        [vote === 'great' ? 'great_votes' : 'bad_votes']:
          (vote === 'great' ? (plan.great_votes || 0) : (plan.bad_votes || 0)) + 1,
      };
      if (newVotedUsers.length >= participants.length) updateData.status = 'ended';
      await base44.entities.PartyPlan.update(planId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allPlans']);
      setShowVotingModal(false);
    },
  });

  const renewMutation = useMutation({
    mutationFn: async (renewData) => {
      await base44.entities.PartyPlan.update(planId, {
        ...renewData,
        status: 'renewed',
        great_votes: 0,
        bad_votes: 0,
        voted_users: [],
      });
      await base44.entities.ChatMessage.create({
        sender_id: currentUser.id,
        plan_id: planId,
        message_type: 'group',
        content: '🔄 O plano foi renovado! Let\'s gooo 😎',
        is_read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allPlans']);
      queryClient.invalidateQueries(['groupMessages', planId]);
      setShowRenewModal(false);
    },
  });

  const terminateMutation = useMutation({
    mutationFn: async () => {
      const terminatedAt = new Date().toISOString();
      await base44.entities.PartyPlan.update(planId, {
        status: 'terminated',
        terminated_at: terminatedAt,
      });
      await base44.entities.ChatMessage.create({
        sender_id: currentUser.id,
        plan_id: planId,
        message_type: 'group',
        content: '❌ O administrador encerrou este plano. O grupo será removido em 24 horas.',
        is_read: false,
      });
    },
    onSuccess: () => {
      setShowDeleteModal(false);
      queryClient.invalidateQueries(['allPlans']);
      queryClient.invalidateQueries(['groupMessages', planId]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      for (const p of participants) await base44.entities.PlanParticipant.delete(p.id);
      for (const m of messages) await base44.entities.ChatMessage.delete(m.id);
      await base44.entities.PartyPlan.delete(planId);
    },
    onSuccess: () => {
      setShowDeleteModal(false);
      navigate(createPageUrl('Chat'));
    },
  });

  const adminEditMutation = useMutation({
    mutationFn: (data) => base44.entities.PartyPlan.update(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allPlans']);
      setShowAdminEditModal(false);
    },
  });

  // ── Admin Handlers ─────────────────────────────────────────────────────────
  const handlePinMessage = async (msgId) => {
    const pinned = plan.pinned_messages || [];
    await base44.entities.PartyPlan.update(planId, { pinned_messages: [...pinned, msgId] });
    queryClient.invalidateQueries(['allPlans']);
  };
  const handleUnpinMessage = async (msgId) => {
    const pinned = plan.pinned_messages || [];
    await base44.entities.PartyPlan.update(planId, { pinned_messages: pinned.filter(id => id !== msgId) });
    queryClient.invalidateQueries(['allPlans']);
  };
  const handlePinStory = async (storyId) => {
    await base44.entities.ExperienceStory.update(storyId, { is_pinned: true });
    const pinned = plan.pinned_stories || [];
    await base44.entities.PartyPlan.update(planId, { pinned_stories: [...pinned, storyId] });
    queryClient.invalidateQueries(['planStories', planId]);
  };
  const handleUnpinStory = async (storyId) => {
    await base44.entities.ExperienceStory.update(storyId, { is_pinned: false });
    const pinned = plan.pinned_stories || [];
    await base44.entities.PartyPlan.update(planId, { pinned_stories: pinned.filter(id => id !== storyId) });
    queryClient.invalidateQueries(['planStories', planId]);
  };
  const handleRemoveMember = async (memberId) => {
    const participation = participants.find(p => p.user_id === memberId);
    if (participation) {
      await base44.entities.PlanParticipant.delete(participation.id);
      queryClient.invalidateQueries(['planParticipants', planId]);
    }
  };

  if (!planId) {
    navigate(createPageUrl('Chat'));
    return null;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#0b0b0b] overflow-hidden">

      {/* Background blur from group image */}
      {plan?.group_image && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${plan.group_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(60px) brightness(0.18)',
            opacity: 0.7,
          }}
        />
      )}

      {/* Header */}
      <GroupChatHeader
        plan={plan}
        planStatus={planStatus}
        isChatLocked={isChatLocked}
        hasVoted={hasVoted}
        isAdmin={isAdmin}
        themeColor={themeColor}
        onBack={() => navigate(createPageUrl('Chat'))}
        onInfo={() => navigate(createPageUrl('PlanDetails') + '?id=' + planId)}
        onAdminActions={() => setShowAdminActions(true)}
        onVote={() => setShowVotingModal(true)}
        onRenew={() => setShowRenewModal(true)}
        onDelete={() => setShowDeleteModal(true)}
      />

      {/* Stories Bar */}
      <div className="relative z-10 border-b border-gray-800/40 bg-black/30 backdrop-blur-sm">
        <ChatStoryBar
          stories={[...stories].sort((a, b) => (a.is_pinned ? -1 : 1))}
          profilesMap={profilesMap}
          currentUserId={currentUser?.id}
          canPost={planStatus === 'happening'}
          onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
          onAddStory={() => navigate(createPageUrl('AddStory') + `?planId=${planId}`)}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto relative z-10 px-4 py-4">
        {messagesLoading ? (
          <div className="flex justify-center items-center h-full">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${themeColor}40`, borderTopColor: themeColor }}
            />
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span className="text-5xl">👋</span>
            <p className="text-gray-500 text-sm">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          sortedMessages.map((msg, index) => {
            const prevMsg = sortedMessages[index - 1];
            const nextMsg = sortedMessages[index + 1];
            const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
            const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
            const isMe = msg.sender_id === currentUser?.id;
            const sender = isMe ? myProfile : profilesMap[msg.sender_id];
            return (
              <GroupMessageBubble
                key={msg.id}
                message={msg}
                isMe={isMe}
                sender={sender}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
                themeColor={themeColor}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-10">
        <GroupChatInput
          isChatLocked={isChatLocked}
          isPending={sendMutation.isPending}
          themeColor={themeColor}
          userId={currentUser?.id}
          onSend={(content) => sendMutation.mutate(content)}
        />
      </div>

      {/* ── Modals ── */}
      <GroupAdminActions
        isOpen={showAdminActions}
        onClose={() => setShowAdminActions(false)}
        participants={participants}
        profilesMap={profilesMap}
        stories={stories}
        messages={sortedMessages}
        pinnedStories={plan?.pinned_stories || []}
        pinnedMessages={plan?.pinned_messages || []}
        onPinStory={handlePinStory}
        onUnpinStory={handleUnpinStory}
        onPinMessage={handlePinMessage}
        onUnpinMessage={handleUnpinMessage}
        onRemoveMember={handleRemoveMember}
        onInviteUser={() => {}}
        currentUserId={currentUser?.id}
        isAdmin={isAdmin}
        onEditPlan={() => { setShowAdminActions(false); setShowAdminEditModal(true); }}
      />
      <VotingModal
        isOpen={showVotingModal}
        onClose={() => setShowVotingModal(false)}
        onVote={(vote) => voteMutation.mutate(vote)}
        planTitle={plan?.title || ''}
        isLoading={voteMutation.isPending}
      />
      <RenewPlanModal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        onConfirm={(data) => renewMutation.mutate(data)}
        onTerminate={() => { setShowRenewModal(false); setShowDeleteModal(true); }}
        plan={plan}
        isLoading={renewMutation.isPending}
      />
      <DeletePlanModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => terminateMutation.mutate()}
        planTitle={plan?.title || ''}
        isLoading={terminateMutation.isPending}
      />
      <AdminEditModal
        isOpen={showAdminEditModal}
        onClose={() => setShowAdminEditModal(false)}
        plan={plan}
        onSave={(data) => adminEditMutation.mutate(data)}
        isLoading={adminEditMutation.isPending}
        onDelete={() => { setShowAdminEditModal(false); setShowDeleteModal(true); }}
      />
    </div>
  );
}
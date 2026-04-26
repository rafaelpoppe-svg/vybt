import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import GroupChatHeader from '../components/chat/GroupChatHeader';
import GroupChatInput from '../components/chat/GroupChatInput';
import GroupMessageBubble from '../components/chat/GroupMessageBubble';
import ChatStoryBar from '../components/chat/ChatStoryBar';
import GroupChatGalleryTab from '../components/chat/GroupChatGalleryTab';
import GroupAdminActions from '../components/chat/GroupAdminActions';
import HighlightPlanModal from '../components/plan/HighlightPlanModal';
import VotingModal from '../components/plan/VotingModal';
import RenewPlanModal from '../components/plan/RenewPlanModal';
import DeletePlanModal from '../components/plan/DeletePlanModal';
import AdminEditModal from '../components/plan/AdminEditModal';
import {
  notifyNewGroupMessage,
  notifyPlanRenewed,
  notifyPlanSuccessful,
  notifyPlanUnsuccessful,
} from '../components/notifications/NotificationTriggers';
import { useLanguage } from '../components/common/LanguageContext';
import GroupChatBackground from '../components/chat/GroupChatBackground';

export default function GroupChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const planId = new URLSearchParams(window.location.search).get('planId');

  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [showAdminActions, setShowAdminActions] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdminEditModal, setShowAdminEditModal] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
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

  const { data: plans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: async () => {
      const urlPlanId = new URLSearchParams(window.location.search).get('planId');
      if (urlPlanId) {
        const [specific, recent] = await Promise.all([
          base44.entities.PartyPlan.filter({ id: urlPlanId }),
          base44.entities.PartyPlan.list('-created_date', 100),
        ]);
        const merged = [...recent];
        if (specific[0] && !merged.find(p => p.id === urlPlanId)) merged.push(specific[0]);
        return merged;
      }
      return base44.entities.PartyPlan.list('-created_date', 100);
    },
    staleTime: 2 * 60 * 1000,
  });
  const plan = plans.find(p => p.id === planId);

  const { data: participants = [] } = useQuery({
    queryKey: ['planParticipants', planId],
    queryFn: () => base44.entities.PlanParticipant.filter({ plan_id: planId }),
    enabled: !!planId,
    staleTime: 60 * 1000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['groupMessages', planId],
    queryFn: () => base44.entities.ChatMessage.filter({ plan_id: planId, message_type: 'group' }),
    enabled: !!planId,
    staleTime: 0,
    refetchInterval: false,
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['planStories', planId],
    queryFn: () => base44.entities.ExperienceStory.filter({ plan_id: planId }),
    enabled: !!planId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 200),
    staleTime: 5 * 60 * 1000,
  });
  const profilesMap = userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});

  const { data: myFriendships = [] } = useQuery({
    queryKey: ['myFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
  });
  const friendProfiles = myFriendships.map(f => profilesMap[f.friend_id]).filter(Boolean);

  useEffect(() => {
    if (!planId || !currentUser?.id) return;
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create' && event.data?.plan_id === planId) {
        const { id } = event.data;
        queryClient.setQueryData(['groupMessages', planId], (old = []) => {
          const withoutOptimistic = old.filter(m => !m.id.startsWith('optimistic-'));
          if (withoutOptimistic.some(m => m.id === id)) return old;
          return [...withoutOptimistic, event.data];
        });
      }
    });
    return () => unsubscribe();
  }, [planId, currentUser?.id, queryClient]);

  // Group chat messages don't support is_read updates (RLS only allows update by sender/receiver)
  // Read state for group chats is not tracked per-message

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_date) - new Date(b.created_date)
  );

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [sortedMessages.length]);

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
    const votingEnds = new Date(endTime.getTime() + 6 * 60 * 60 * 1000);
    const votedCount = plan.voted_users?.length || 0;
    if (votedCount > 0 && participants.length > 0 && votedCount >= participants.length) return 'ended';
    if (now < startTime) return 'upcoming';
    if (now >= startTime && now < endTime) return 'happening';
    if (now >= endTime && now < votingEnds) return 'voting';
    return 'ended';
  };

  const planStatus = getPlanStatus();
  const isAwaitingAdmin = planStatus === 'ended' && plan?.status !== 'terminated' && plan?.status !== 'renewed';
  const isChatLocked = planStatus === 'voting' || isAwaitingAdmin;
  const hasVoted = plan?.voted_users?.includes(currentUser?.id);
  const themeColor = plan?.theme_color || '#00c6d2';

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      if (!currentUser?.id || !planId) return;
      const msgPromise = base44.entities.ChatMessage.create({
        sender_id: currentUser.id,
        plan_id: planId,
        message_type: 'group',
        content,
        is_read: false,
      });
      notifyNewGroupMessage(
        planId, currentUser.id,
        myProfile?.display_name || currentUser.full_name || t.someone
      );
      return msgPromise;
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries(['groupMessages', planId]);
      const previous = queryClient.getQueryData(['groupMessages', planId]);
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
      if (context?.previous) {
        queryClient.setQueryData(['groupMessages', planId], context.previous);
      }
    },
    onSuccess: (realMsg) => {
      if (realMsg) {
        queryClient.setQueryData(['groupMessages', planId], (old = []) => {
          const withoutOptimistic = old.filter(m => !m.id.startsWith('optimistic-'));
          if (withoutOptimistic.some(m => m.id === realMsg.id)) return withoutOptimistic;
          return [...withoutOptimistic, realMsg];
        });
      }
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ vote, wantsToLeave }) => {
      const currentVotedUsers = plan.voted_users || [];
      const newVotedUsers = [...currentVotedUsers, currentUser.id];
      const updateData = {
        voted_users: newVotedUsers,
        [vote === 'great' ? 'great_votes' : 'bad_votes']:
          (vote === 'great' ? (plan.great_votes || 0) : (plan.bad_votes || 0)) + 1,
      };
      const allVoted = newVotedUsers.length >= participants.length;
      if (allVoted) {
        const totalGreat = (vote === 'great' ? (plan.great_votes || 0) : (plan.great_votes || 0)) + (vote === 'great' ? 1 : 0);
        const totalBad = (vote === 'bad' ? (plan.bad_votes || 0) : (plan.bad_votes || 0)) + (vote === 'bad' ? 1 : 0);
        updateData.status = 'ended';
        const isSuccess = totalGreat >= totalBad;
        participants.forEach(p => {
          if (isSuccess) notifyPlanSuccessful(p.user_id, plan);
          else notifyPlanUnsuccessful(p.user_id, plan);
        });
      }
      await base44.entities.PartyPlan.update(planId, updateData);
      if (wantsToLeave && myParticipation) {
        await base44.entities.PlanParticipant.delete(myParticipation.id);
      }
    },
    onSuccess: (_, { wantsToLeave }) => {
      queryClient.invalidateQueries(['allPlans']);
      queryClient.invalidateQueries(['planParticipants', planId]);
      setShowVotingModal(false);
      if (wantsToLeave) navigate(createPageUrl('Chat'));
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
        content: t.planRenewed,
        is_read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allPlans']);
      queryClient.invalidateQueries(['groupMessages', planId]);
      setShowRenewModal(false);
      participants.forEach(p => {
        if (p.user_id !== currentUser?.id) notifyPlanRenewed(p.user_id, plan);
      });
    },
  });

  const isLive = planStatus === 'happening';

  const terminateMutation = useMutation({
    mutationFn: async () => {
      const terminatedAt = new Date().toISOString();
      const updateData = {
        status: 'terminated',
        terminated_at: terminatedAt,
      };
      if (isLive) {
        updateData.show_in_explore = false;
        updateData.show_in_map = false;
        updateData.is_highlighted = false;
        updateData.is_on_fire = false;
      }
      await base44.entities.PartyPlan.update(planId, updateData);
      await base44.entities.ChatMessage.create({
        sender_id: currentUser.id,
        plan_id: planId,
        message_type: 'group',
        content: t.planTerminatedMsg,
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
    mutationFn: async (data) => {
      const changes = [];
      if (plan && data.title && data.title !== plan.title)
        changes.push(`Renamed from "${plan.title}" to "${data.title}"`);
      if (plan && data.time && data.time !== plan.time)
        changes.push(`Start time changed to ${data.time}`);
      if (plan && data.end_time && data.end_time !== plan.end_time)
        changes.push(`End time changed to ${data.end_time}`);
      if (plan && data.location_address && data.location_address !== plan.location_address)
        changes.push(`Address updated to "${data.location_address}"`);
      if (plan && data.cover_image && data.cover_image !== plan.cover_image)
        changes.push('Group image updated');

      await base44.entities.PartyPlan.update(planId, data);

      if (changes.length > 0 && currentUser?.id) {
        await base44.entities.ChatMessage.create({
          sender_id: currentUser.id,
          plan_id: planId,
          message_type: 'group',
          content: `plan_update:${changes.join('\n')}`,
          is_read: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allPlans']);
      queryClient.invalidateQueries(['groupMessages', planId]);
      setShowAdminEditModal(false);
    },
  });

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

  const isMember = !!myParticipation;
  const participantsLoaded = participants !== undefined;

  if (currentUser && participantsLoaded && !isMember) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 gap-6" style={{ background: 'var(--bg)', height: '100dvh' }}>
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${plan?.theme_color || '#00c6d2'}60, #542b9b60)` }}>
          {plan?.cover_image
            ? <img src={plan.cover_image} className="w-full h-full object-cover" alt="" />
            : <span className="flex items-center justify-center w-full h-full text-4xl">🎉</span>}
        </div>
        <div>
          <h2 className="text-white font-bold text-xl mb-1">{plan?.title || t.plans}</h2>
          <p className="text-gray-400 text-sm">{t.joinPlanToAccess}</p>
        </div>
        <button
          onClick={() => navigate(createPageUrl('PlanDetails') + '?id=' + planId)}
          className="px-8 py-3 rounded-2xl font-bold text-[#0b0b0b] text-base"
          style={{ background: `linear-gradient(135deg, ${plan?.theme_color || '#00c6d2'}, #542b9b)` }}
        >
          {t.joinPlan}
        </button>
        <button
          onClick={() => navigate(createPageUrl('Chat'))}
          className="text-gray-500 text-sm"
        >
          {t.backBtn}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}>
      <GroupChatBackground theme={plan?.chat_background_theme} />

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
        onHighlight={() => setShowHighlightModal(true)}
      />

      <div
        className="relative z-10 border-b border-gray-800/40 backdrop-blur-sm flex-shrink-0"
        style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 80%, transparent 20%)' }}
      >
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex-1">
            <ChatStoryBar
              stories={[...stories].sort((a, b) => (a.is_pinned ? -1 : 1))}
              profilesMap={profilesMap}
              currentUserId={currentUser?.id}
              canPost={planStatus === 'happening'}
              isHappening={planStatus === 'happening'}
              onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
              onAddStory={() => navigate(createPageUrl('AddStory') + `?planId=${planId}`)}
            />
          </div>
          <button
            onClick={() => setShowGallery(true)}
            className="flex-shrink-0 ml-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/70 text-white text-sm font-semibold transition-colors"
          >
            📸
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 px-4 py-4 pb-24" style={{ overscrollBehavior: 'contain' }}>
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
            <p className="text-gray-500 text-sm">{t.beFirstToMessage}</p>
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

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <GroupChatInput
          isChatLocked={isChatLocked}
          isPending={sendMutation.isPending}
          themeColor={themeColor}
          userId={currentUser?.id}
          onSend={(content) => sendMutation.mutate(content)}
        />
      </div>

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
        onInviteUser={async (friendId) => {
          if (!currentUser?.id) return;
          await base44.entities.ChatMessage.create({
            sender_id: currentUser.id,
            receiver_id: friendId,
            message_type: 'direct',
            content: `plan_invite:${planId}`,
            is_read: false,
          });
        }}
        friends={friendProfiles}
        currentUserId={currentUser?.id}
        isAdmin={isAdmin}
        planStatus={planStatus}
        onEditPlan={() => {
          if (planStatus === 'voting' || planStatus === 'ended') return;
          setShowAdminActions(false);
          setShowAdminEditModal(true);
        }}
      />
      <VotingModal
        isOpen={showVotingModal}
        onClose={() => setShowVotingModal(false)}
        onVote={(vote, wantsToLeave) => voteMutation.mutate({ vote, wantsToLeave })}
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
        isLive={isLive}
      />
      <AdminEditModal
        isOpen={showAdminEditModal}
        onClose={() => setShowAdminEditModal(false)}
        plan={plan}
        onSave={(data) => adminEditMutation.mutate(data)}
        isLoading={adminEditMutation.isPending}
        onDelete={() => { setShowAdminEditModal(false); setShowDeleteModal(true); }}
        isLive={isLive}
      />
      <HighlightPlanModal
        isOpen={showHighlightModal}
        onClose={() => setShowHighlightModal(false)}
        planTitle={plan?.title || ''}
        planTags={plan?.tags || []}
        onConfirm={() => {
          base44.entities.PartyPlan.update(planId, { is_highlighted: true });
          queryClient.invalidateQueries(['allPlans']);
        }}
      />

      {showGallery && (
        <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: 'var(--bg)' }}>
          <GroupChatGalleryTab
            stories={stories}
            profilesMap={profilesMap}
            onClose={() => setShowGallery(false)}
          />
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ChevronLeft, MapPin, Calendar, Clock, Users, MessageCircle, 
  Share2, Check, Plus, Camera, Loader2, Flame, Sparkles, Shield, LogOut, Flag, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoryCard from '../components/feed/StoryCard';
import PartyTag from '../components/common/PartyTag';
import HighlightPlanModal from '../components/plan/HighlightPlanModal';
import PlanCountdown from '../components/plan/PlanCountdown';
import LeavePlanModal from '../components/plan/LeavePlanModal';
import ReportContentModal from '../components/moderation/ReportContentModal';
import AttendingToggle from '../components/plan/AttendingToggle';
import AttendingAvatars from '../components/plan/AttendingAvatars';
import AdminEditModal from '../components/plan/AdminEditModal';
import InviteToPlanModal from '../components/plan/InviteToPlanModal';
import { notifyNewGroupMember } from '../components/notifications/NotificationTriggers';

export default function PlanDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('id');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [joinRequestSent, setJoinRequestSent] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {}
    };
    getUser();
  }, []);

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => base44.entities.PartyPlan.filter({ id: planId }),
    select: (data) => data[0],
    enabled: !!planId
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['planParticipants', planId],
    queryFn: () => base44.entities.PlanParticipant.filter({ plan_id: planId }),
    enabled: !!planId
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['participantProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
  });

  const { data: planStories = [] } = useQuery({
    queryKey: ['planStories', planId],
    queryFn: () => base44.entities.ExperienceStory.filter({ plan_id: planId }),
    enabled: !!planId
  });

  const { data: planCommunity } = useQuery({
    queryKey: ['planCommunity', plan?.community_id],
    queryFn: () => base44.entities.Community.filter({ id: plan.community_id }).then(r => r[0]),
    enabled: !!plan?.community_id,
  });

  // Check user's plan count in this region
  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myAllParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const { data: myJoinRequests = [] } = useQuery({
    queryKey: ['myJoinRequests', currentUser?.id],
    queryFn: () => base44.entities.PlanJoinRequest.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ['allPlansForRegion'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 100),
  });

  const { data: myFriendships = [] } = useQuery({
    queryKey: ['myFriendshipsPlanDetails', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id,
  });
  const friendIds = myFriendships.map(f => f.friend_id);

  const profilesMap = userProfiles.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  // Check plan limit (max 3 per region)
  const myPlansInRegion = myParticipations.filter(p => {
    const participantPlan = allPlans.find(pl => pl.id === p.plan_id);
    return participantPlan?.city === plan?.city;
  });
  const canJoinMorePlans = myPlansInRegion.length < 3;

  useEffect(() => {
    if (currentUser && participants.length > 0) {
      setIsJoined(participants.some(p => p.user_id === currentUser.id));
    }
  }, [currentUser, participants]);

  const isCreator = plan?.creator_id === currentUser?.id;
  const myParticipationRecord = participants.find(p => p.user_id === currentUser?.id);
  const isAdminOfPlan = isCreator || myParticipationRecord?.is_admin;
  const themeColor = plan?.theme_color || '#00c6d2';
  const isVoting = plan?.status === 'voting';
  const canJoinOrLeave = !isVoting;

  const requestJoinMutation = useMutation({
    mutationFn: async (message = '') => {
      if (!currentUser) { base44.auth.redirectToLogin(); return; }
      await base44.entities.PlanJoinRequest.create({
        plan_id: planId,
        user_id: currentUser.id,
        status: 'pending',
        message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myJoinRequests', currentUser?.id]);
      setJoinRequestSent(true);
    }
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        base44.auth.redirectToLogin();
        return;
      }
      if (!canJoinMorePlans && !isJoined) {
        throw new Error('Plan limit reached');
      }
      await base44.entities.PlanParticipant.create({
        plan_id: planId,
        user_id: currentUser.id,
        status: 'going',
        is_admin: false,
        joined_at: new Date().toISOString(),
        stories_posted: 0
      });
      // Update recent joins count for OnFire
      const currentJoins = plan.recent_joins || 0;
      await base44.entities.PartyPlan.update(planId, {
        recent_joins: currentJoins + 1
      });

      // Notify other members
      const profile = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
      await notifyNewGroupMember(planId, currentUser.id, profile[0]?.display_name || currentUser.full_name || 'Alguém');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['planParticipants', planId]);
      setIsJoined(true);
    }
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const myParticipation = participants.find(p => p.user_id === currentUser.id);
      if (myParticipation) {
        await base44.entities.PlanParticipant.delete(myParticipation.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['planParticipants', planId]);
      setIsJoined(false);
    }
  });

  const reportPlanMutation = useMutation({
    mutationFn: ({ reason, details }) => base44.entities.Report.create({
      reporter_user_id: currentUser.id,
      reported_plan_id: planId,
      type: 'plan',
      reason,
      details: details || '',
      status: 'pending'
    }),
    onSuccess: () => setShowReportModal(false)
  });

  const editPlanMutation = useMutation({
    mutationFn: (data) => base44.entities.PartyPlan.update(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['plan', planId]);
      setShowEditModal(false);
    }
  });

  const highlightMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.PartyPlan.update(planId, {
        is_highlighted: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['plan', planId]);
      setShowHighlightModal(false);
    }
  });

  if (planLoading || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
      </div>
    );
  }

  const participantProfiles = participants.map(p => profilesMap[p.user_id]).filter(Boolean);
  const isOnFire = plan.is_on_fire || (plan.recent_joins && plan.recent_joins >= 100);
  const pendingJoinRequest = myJoinRequests.find(r => r.plan_id === planId && r.status === 'pending');
  const declinedJoinRequest = myJoinRequests.find(r => r.plan_id === planId && r.status === 'declined');

  return (
    <div className="min-h-screen pb-36" style={{ background: 'var(--bg)' }}>
      {/* Header Image */}
      <div className="relative h-64">
        {plan.cover_image ? (
          <img src={plan.cover_image} alt={plan.title} className="w-full h-full object-cover" />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${themeColor}50, #542b9b50)` }}
          >
            <span className="text-6xl">🎉</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full bg-black/50 backdrop-blur-sm"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </motion.button>

        {/* Share + Report buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <motion.button whileTap={{ scale: 0.9 }} className="p-2 rounded-full bg-black/50 backdrop-blur-sm">
            <Share2 className="w-5 h-5 text-white" />
          </motion.button>
          {currentUser && !isCreator && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowReportModal(true)}
              className="p-2 rounded-full bg-black/50 backdrop-blur-sm"
            >
              <Flag className="w-5 h-5 text-orange-400" />
            </motion.button>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <PlanCountdown plan={plan} size="sm" />
          {(isOnFire || plan.is_highlighted) && (
            <div 
              className={`px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1 ${
                isOnFire ? 'bg-orange-500/80' : 'bg-[#542b9b]/80'
              }`}
            >
              {isOnFire ? (
                <>
                  <span className="text-sm">🔥</span>
                  <span className="text-xs text-white font-medium">On Fire</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#00c6d2]" />
                  <span className="text-xs text-white font-medium">Highlighted</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Theme color accent bar */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: themeColor }}
        />
      </div>

      {/* Content */}
      <main className="px-4 pt-6 relative z-10 space-y-6">
        {/* Title */}
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.title}</h1>

        {/* Community badge */}
        {planCommunity && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(createPageUrl('CommunityView') + `?id=${planCommunity.id}`)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border w-fit"
            style={{ borderColor: `${planCommunity.theme_color || '#00c6d2'}50`, background: `${planCommunity.theme_color || '#00c6d2'}12` }}
          >
            {planCommunity.cover_image
              ? <img src={planCommunity.cover_image} alt="" className="w-5 h-5 rounded-md object-cover" />
              : <span className="text-sm">⭐</span>}
            <span className="text-xs font-bold" style={{ color: planCommunity.theme_color || '#00c6d2' }}>
              {planCommunity.name}
            </span>
            <span className="text-gray-500 text-[10px]">Community →</span>
          </motion.button>
        )}

        {/* Info card with tags inside */}
        <div 
          className="space-y-3 p-4 rounded-xl"
          style={{ backgroundColor: `${themeColor}10`, borderLeft: `3px solid ${themeColor}` }}
        >
          <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
            <Calendar className="w-5 h-5" style={{ color: themeColor }} />
            <span>{format(new Date(plan.date), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
            <Clock className="w-5 h-5" style={{ color: themeColor }} />
            <span>{plan.time}{plan.end_time && ` - ${plan.end_time}`}</span>
          </div>
          <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
            <MapPin className="w-5 h-5" style={{ color: themeColor }} />
            <span>{plan.location_address}, {plan.city}</span>
          </div>

          {/* Tags — below the divider inside the card */}
          {plan.tags?.length > 0 && (
            <>
              <div className="border-t border-white/10 pt-3 flex gap-2 flex-wrap">
                {plan.tags.map((tag, i) => (
                  <PartyTag key={i} tag={tag} size="md" />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Description */}
        {plan.description && (
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>About</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{plan.description}</p>
          </div>
        )}

        {/* Invite Friends Button (for admins only) */}
        {isAdminOfPlan && plan.status !== 'terminated' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInviteModal(true)}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium border"
            style={{
              background: `linear-gradient(135deg, ${themeColor}22, ${themeColor}11)`,
              borderColor: `${themeColor}44`,
              color: themeColor,
            }}
          >
            <Users className="w-5 h-5" />
            Invite Friends
          </motion.button>
        )}

        {/* Edit Plan Button (for admins only) */}
        {isAdminOfPlan && plan.status !== 'terminated' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEditModal(true)}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium border"
            style={{
              background: `linear-gradient(135deg, ${themeColor}22, ${themeColor}11)`,
              borderColor: `${themeColor}44`,
              color: themeColor,
            }}
          >
            <Pencil className="w-5 h-5" />
            Edit Plan
          </motion.button>
        )}

        {/* Highlight Plan Button (for creator) — requires 7+ members */}
        {isCreator && !plan.is_highlighted && (
          participants.length >= 7 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHighlightModal(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center gap-2 text-orange-400"
            >
              <Flame className="w-5 h-5" />
              Highlight this plan - €2.99
            </motion.button>
          ) : (
            <div className="w-full py-3 rounded-xl border flex items-center justify-center gap-2 text-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <Flame className="w-4 h-4" />
              Highlight unlocks at 7 members ({participants.length}/7)
            </div>
          )
        )}

        {/* Attending toggle (only for joined users, not during voting) */}
        {isJoined && canJoinOrLeave && (() => {
          const myParticipation = participants.find(p => p.user_id === currentUser?.id);
          return myParticipation ? (
            <div className="flex items-center justify-between py-3 px-4 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <AttendingToggle
                participation={myParticipation}
                planId={planId}
                themeColor={themeColor}
              />
            </div>
          ) : null;
        })()}

        {/* Participants */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
            <Users className="w-5 h-5" style={{ color: themeColor }} />
            {participants.length} Attending
          </h3>
          <AttendingAvatars
            participants={participants}
            profilesMap={profilesMap}
            themeColor={themeColor}
          />
        </div>

        {/* Experience Stories */}
        {planStories.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Camera className="w-5 h-5 text-[#542b9b]" />
              Experience Stories
            </h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {planStories.map((story, i) => (
                <StoryCard
                  key={story.id}
                  user={profilesMap[story.user_id]}
                  story={story}
                  colorIndex={i}
                  isOwn={story.user_id === currentUser?.id}
                  onClick={() => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Add Story Button (only for members AND only when plan is happening) */}
        {isJoined && plan.status === 'happening' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(createPageUrl('AddStory') + `?planId=${planId}`)}
            className="w-full py-3 rounded-xl border flex items-center justify-center gap-2"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <Camera className="w-5 h-5" />
            Share your experience
          </motion.button>
        )}
        {isJoined && isVoting && (
          <div className="w-full py-3 rounded-xl border flex items-center justify-center gap-2 cursor-not-allowed" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <Camera className="w-5 h-5" />
            Stories unavailable during voting
          </div>
        )}

        {/* Plan limit warning */}
        {!canJoinMorePlans && !isJoined && !isVoting && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            You've reached the limit of 3 plans in {plan.city}. Leave a plan to join this one.
          </div>
        )}

        {/* Voting Period Notice */}
        {isVoting && (
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm text-center">
            🗳️ Voting period active - Cannot join or leave during voting (6 hours)
          </div>
        )}

        {/* Terminated Notice */}
        {plan.status === 'terminated' && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-red-400 font-bold text-lg mb-1">❌ Plan Terminated</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This plan was terminated by the admin and will be deleted in 24 hours
            </p>
          </div>
        )}
      </main>

      {/* Bottom Actions */}
      {plan.status !== 'terminated' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50" style={{ background: 'linear-gradient(to top, var(--bg) 60%, transparent)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
          <div className="flex gap-3">
            {isJoined && (
              <Button
                onClick={() => navigate(createPageUrl('Chat') + `?planId=${planId}`)}
                variant="outline"
                className="flex-1 py-6 rounded-full border" style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Group Chat
              </Button>
            )}
            
            {!isVoting && (
              isJoined ? (
                <Button
                  onClick={() => setShowLeaveModal(true)}
                  disabled={leaveMutation.isPending}
                  className="flex-1 py-6 rounded-full disabled:opacity-50" style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}
                >
                  {leaveMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="w-5 h-5 mr-2" />
                      Sair
                    </>
                  )}
                </Button>
              ) : plan?.is_private ? (
                // Private plan — show request flow
                pendingJoinRequest || joinRequestSent ? (
                  <Button
                    disabled
                    className="flex-1 py-6 rounded-full cursor-not-allowed" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                  >
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Request Pending...
                  </Button>
                ) : declinedJoinRequest ? (
                  <Button disabled className="flex-1 py-6 rounded-full text-red-400 border border-red-500/30 cursor-not-allowed" style={{ background: 'var(--surface)' }}>
                    ❌ Request Declined
                  </Button>
                ) : (
                  <Button
                    onClick={() => requestJoinMutation.mutate()}
                    disabled={requestJoinMutation.isPending || !canJoinMorePlans}
                    className="flex-1 py-6 rounded-full font-bold disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #542b9b, #00c6d2)', color: 'white' }}
                  >
                    {requestJoinMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>🔒 Request to Join</>
                    )}
                  </Button>
                )
              ) : (
                <Button
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending || !canJoinMorePlans}
                  className="flex-1 py-6 rounded-full font-bold disabled:opacity-50"
                  style={{ backgroundColor: themeColor, color: '#0b0b0b' }}
                >
                  {joinMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Join Plan
                    </>
                  )}
                </Button>
              )
            )}
          </div>
        </div>
      )}

      {/* Highlight Modal */}
      <HighlightPlanModal
        isOpen={showHighlightModal}
        onClose={() => setShowHighlightModal(false)}
        onConfirm={() => highlightMutation.mutate()}
        planTitle={plan.title}
        planTags={plan.tags || []}
        isLoading={highlightMutation.isPending}
      />

      {/* Report Modal */}
      <ReportContentModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={(data) => reportPlanMutation.mutate(data)}
        contentType="plan"
        contentTitle={plan.title}
        isLoading={reportPlanMutation.isPending}
      />

      {/* Edit Plan Modal */}
      <AdminEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        plan={plan}
        onSave={(data) => editPlanMutation.mutate(data)}
        isLoading={editPlanMutation.isPending}
        isLive={plan.status === 'happening'}
      />

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteToPlanModal
          plan={plan}
          friends={friendIds}
          profilesMap={profilesMap}
          currentUser={currentUser}
          participantIds={new Set(participants.map(p => p.user_id))}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Leave Modal */}
      <LeavePlanModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={() => {
          setShowLeaveModal(false);
          leaveMutation.mutate();
        }}
        planTitle={plan.title}
        isLoading={leaveMutation.isPending}
      />
    </div>
  );
}
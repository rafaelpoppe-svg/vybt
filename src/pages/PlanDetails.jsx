import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ChevronLeft, MapPin, Calendar, Clock, Users, MessageCircle, 
  Share2, Check, Plus, Camera, Loader2, Flame, Sparkles, Shield, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoryCard from '../components/feed/StoryCard';
import PartyTag from '../components/common/PartyTag';
import HighlightPlanModal from '../components/plan/HighlightPlanModal';
import PlanCountdown from '../components/plan/PlanCountdown';
import LeavePlanModal from '../components/plan/LeavePlanModal';

export default function PlanDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('id');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

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

  // Check user's plan count in this region
  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myAllParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ['allPlansForRegion'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 100),
  });

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
  const themeColor = plan?.theme_color || '#00fea3';
  const isVoting = plan?.status === 'voting';
  const canJoinOrLeave = !isVoting;

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
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
      </div>
    );
  }

  const participantProfiles = participants.map(p => profilesMap[p.user_id]).filter(Boolean);
  const isOnFire = plan.is_on_fire || (plan.recent_joins && plan.recent_joins >= 100);

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-32">
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-transparent to-transparent" />
        
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full bg-black/50 backdrop-blur-sm"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </motion.button>

        {/* Share button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 backdrop-blur-sm"
        >
          <Share2 className="w-5 h-5 text-white" />
        </motion.button>

        {/* Status Badge */}
        <div className="absolute top-4 right-16 flex gap-2">
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
                  <Sparkles className="w-4 h-4 text-[#00fea3]" />
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
      <main className="px-4 -mt-8 relative z-10 space-y-6">
        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          {plan.tags?.map((tag, i) => (
            <PartyTag key={i} tag={tag} size="md" />
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white">{plan.title}</h1>

        {/* Info with end_time */}
        <div 
          className="space-y-3 p-4 rounded-xl"
          style={{ backgroundColor: `${themeColor}10`, borderLeft: `3px solid ${themeColor}` }}
        >
          <div className="flex items-center gap-3 text-gray-300">
            <Calendar className="w-5 h-5" style={{ color: themeColor }} />
            <span>{format(new Date(plan.date), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <Clock className="w-5 h-5" style={{ color: themeColor }} />
            <span>{plan.time}{plan.end_time && ` - ${plan.end_time}`}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <MapPin className="w-5 h-5" style={{ color: themeColor }} />
            <span>{plan.location_address}, {plan.city}</span>
          </div>
        </div>

        {/* Description */}
        {plan.description && (
          <div>
            <h3 className="text-white font-semibold mb-2">About</h3>
            <p className="text-gray-400">{plan.description}</p>
          </div>
        )}

        {/* Highlight Plan Button (for creator) */}
        {isCreator && !plan.is_highlighted && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHighlightModal(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center gap-2 text-orange-400"
          >
            <Flame className="w-5 h-5" />
            Highlight this plan - €2.99
          </motion.button>
        )}

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: themeColor }} />
              {participants.length} Going
            </h3>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {participantProfiles.map((profile, i) => {
              const participation = participants.find(p => p.user_id === profile.user_id);
              const isCreator = plan.creator_id === profile.user_id;
              return (
                <div key={profile.id} className="relative">
                  <StoryCard
                    user={profile}
                    size="sm"
                    colorIndex={i}
                    onClick={() => navigate(createPageUrl('UserProfile') + `?id=${profile.user_id}`)}
                  />
                  {isCreator && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#542b9b] text-[10px] text-white font-medium flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" />
                      Admin
                    </div>
                  )}
                  <p className="text-center text-sm text-white mt-1 font-medium">{profile.display_name}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Experience Stories */}
        {planStories.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
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

        {/* Add Story Button (if joined) */}
        {isJoined && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(createPageUrl('AddStory') + `?planId=${planId}`)}
            className="w-full py-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center gap-2 text-gray-400"
          >
            <Camera className="w-5 h-5" />
            Share your experience
          </motion.button>
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
            <p className="text-gray-400 text-sm">
              This plan was terminated by the admin and will be deleted in 24 hours
            </p>
          </div>
        )}
      </main>

      {/* Bottom Actions */}
      {plan.status !== 'terminated' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b] to-transparent">
          <div className="flex gap-3">
            <Button
              onClick={() => navigate(createPageUrl('Chat') + `?planId=${planId}`)}
              variant="outline"
              className="flex-1 py-6 rounded-full border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Group Chat
            </Button>
            
            {isJoined ? (
              <Button
                onClick={() => setShowLeaveModal(true)}
                disabled={leaveMutation.isPending || !canJoinOrLeave}
                className="flex-1 py-6 rounded-full bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50"
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
            ) : (
              <Button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending || !canJoinMorePlans || !canJoinOrLeave}
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
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ChevronLeft, MapPin, Calendar, Clock, Users, MessageCircle, 
  Share2, Sparkles, Check, Plus, Camera, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoryCircle from '../components/feed/StoryCircle';

export default function PlanDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('id');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isJoined, setIsJoined] = useState(false);

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

  const profilesMap = userProfiles.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  useEffect(() => {
    if (currentUser && participants.length > 0) {
      setIsJoined(participants.some(p => p.user_id === currentUser.id));
    }
  }, [currentUser, participants]);

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        base44.auth.redirectToLogin();
        return;
      }
      await base44.entities.PlanParticipant.create({
        plan_id: planId,
        user_id: currentUser.id,
        status: 'going'
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

  if (planLoading || !plan) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
      </div>
    );
  }

  const participantProfiles = participants.map(p => profilesMap[p.user_id]).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-32">
      {/* Header Image */}
      <div className="relative h-64">
        {plan.cover_image ? (
          <img src={plan.cover_image} alt={plan.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00fea3]/50 flex items-center justify-center">
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

        {plan.is_highlighted && (
          <div className="absolute top-4 right-16 px-3 py-1.5 rounded-full bg-[#542b9b]/80 backdrop-blur-sm flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-[#00fea3]" />
            <span className="text-xs text-white font-medium">Featured</span>
          </div>
        )}
      </div>

      {/* Content */}
      <main className="px-4 -mt-8 relative z-10 space-y-6">
        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          {plan.tags?.map((tag, i) => (
            <span 
              key={i}
              className="px-3 py-1 rounded-full bg-[#00fea3]/20 text-[#00fea3] text-sm font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white">{plan.title}</h1>

        {/* Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-300">
            <Calendar className="w-5 h-5 text-[#00fea3]" />
            <span>{format(new Date(plan.date), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <Clock className="w-5 h-5 text-[#00fea3]" />
            <span>{plan.time}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <MapPin className="w-5 h-5 text-[#00fea3]" />
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

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00fea3]" />
              {participants.length} Going
            </h3>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {participantProfiles.map((profile) => (
              <StoryCircle
                key={profile.id}
                user={profile}
                size="sm"
                onClick={() => navigate(createPageUrl('UserProfile') + `?id=${profile.user_id}`)}
              />
            ))}
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
              {planStories.map((story) => (
                <StoryCircle
                  key={story.id}
                  user={profilesMap[story.user_id]}
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
      </main>

      {/* Bottom Actions */}
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
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
              className="flex-1 py-6 rounded-full bg-gray-800 text-white hover:bg-gray-700"
            >
              {leaveMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Joined
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="flex-1 py-6 rounded-full bg-[#00fea3] text-[#0b0b0b] hover:bg-[#00fea3]/90 font-bold"
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
    </div>
  );
}
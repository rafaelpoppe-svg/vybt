import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, UserPlus, MessageCircle, Check, Loader2, MapPin, Users, PartyPopper, Clapperboard, Music2, Sparkles, MoreVertical, Flag, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VibeTag, { vibeConfig } from '../components/common/VibeTag';
import PartyTag, { partyTagConfig } from '../components/common/PartyTag';
import { notifyFriendRequest } from '../components/notifications/NotificationTriggers';
import ReportUserModal from '../components/user/ReportUserModal';
import BlockUserModal from '../components/user/BlockUserModal';
import VerificationBadge from '../components/profile/VerificationBadge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');

  const [currentUser, setCurrentUser] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {}
    };
    getUser();
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: userId }),
    select: (data) => data[0],
    enabled: !!userId
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendshipStatus', currentUser?.id, userId],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, friend_id: userId }),
    enabled: !!currentUser?.id && !!userId
  });

  const { data: userFriendships = [] } = useQuery({
    queryKey: ['userFriendships', userId],
    queryFn: () => base44.entities.Friendship.filter({ user_id: userId, status: 'accepted' }),
    enabled: !!userId
  });

  const { data: participations = [] } = useQuery({
    queryKey: ['userParticipations', userId],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: userId }),
    enabled: !!userId
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['userStories', userId],
    queryFn: () => base44.entities.ExperienceStory.filter({ user_id: userId }),
    enabled: !!userId
  });

  const existingFriendship = friendships[0];
  const isFriend = existingFriendship?.status === 'accepted';
  const isPending = existingFriendship?.status === 'pending';

  const reportUserMutation = useMutation({
    mutationFn: ({ reason, details }) => base44.entities.Report.create({
      reporter_user_id: currentUser.id,
      reported_user_id: userId,
      type: 'user',
      reason,
      details: details || '',
      status: 'pending'
    }),
    onSuccess: () => {
      setShowReportModal(false);
      toast.success('Denúncia enviada');
    }
  });

  const blockUserMutation = useMutation({
    mutationFn: () => base44.entities.BlockedUser.create({
      user_id: currentUser.id,
      blocked_user_id: userId
    }),
    onSuccess: () => {
      setShowBlockModal(false);
      toast.success('Utilizador bloqueado');
      navigate(-1);
    }
  });

  const addFriendMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Friendship.create({
        user_id: currentUser.id,
        friend_id: userId,
        status: 'pending'
      });
      // Notify the target user
      const myProfiles = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
      const myName = myProfiles[0]?.display_name || currentUser.full_name || 'Alguém';
      await notifyFriendRequest(userId, currentUser.id, myName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friendshipStatus', currentUser?.id, userId]);
    }
  });

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
      </div>
    );
  }

  const photos = profile.photos?.filter(Boolean) || [];
  const hasPhotos = photos.length > 0;

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-24">

      {/* ── Hero Photo Gallery ── */}
      <div className="relative w-full h-[65vh] bg-gray-900 overflow-hidden">
        <AnimatePresence mode="wait">
          {hasPhotos ? (
            <motion.img
              key={photoIndex}
              src={photos[photoIndex]}
              alt=""
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#542b9b]/40 to-[#00fea3]/20">
              <span className="text-white/20 text-9xl font-bold select-none">
                {profile.display_name?.[0] || '?'}
              </span>
            </div>
          )}
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/20 to-transparent" />

        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 p-2 rounded-full bg-black/40 backdrop-blur-md z-10"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>

        {/* More options (report/block) */}
        {currentUser && currentUser.id !== userId && (
          <div className="absolute top-12 right-4 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} className="p-2 rounded-full bg-black/40 backdrop-blur-md">
                  <MoreVertical className="w-5 h-5 text-white" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800">
                <DropdownMenuItem onClick={() => setShowReportModal(true)} className="text-orange-400 hover:text-orange-300">
                  <Flag className="w-4 h-4 mr-2" />
                  Denunciar utilizador
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowBlockModal(true)} className="text-red-400 hover:text-red-300">
                  <Ban className="w-4 h-4 mr-2" />
                  Bloquear utilizador
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Photo dots */}
        {photos.length > 1 && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === photoIndex ? 'w-5 h-1.5 bg-[#00fea3]' : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Tap zones to swipe photos — start below the back button */}
        {photos.length > 1 && (
          <>
            <button
              className="absolute left-0 top-20 bottom-0 w-1/3 z-20"
              onClick={() => setPhotoIndex(i => Math.max(0, i - 1))}
            />
            <button
              className="absolute right-0 top-20 bottom-0 w-1/3 z-20"
              onClick={() => setPhotoIndex(i => Math.min(photos.length - 1, i + 1))}
            />
          </>
        )}

        {/* Name + location pinned to bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-3xl font-bold text-white tracking-tight">{profile.display_name}</h1>
            {profile.date_of_birth && (
              <span className="text-xl text-gray-300 font-semibold">
                {Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {profile.city && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00fea3]" />
                <span className="text-gray-300 text-sm">{profile.city}</span>
              </div>
            )}
            <VerificationBadge isVerified={profile.is_verified} size="sm" />
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-5 pt-5 space-y-7">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Friends', value: userFriendships.length, color: 'text-[#00fea3]' },
            { icon: PartyPopper, label: 'Parties', value: participations.length, color: 'text-[#542b9b]' },
            { icon: Clapperboard, label: 'Stories', value: stories.length, color: 'text-pink-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-gray-900/60 border border-gray-800 rounded-2xl py-4 flex flex-col items-center gap-1">
              <Icon className={`w-5 h-5 ${color}`} />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl px-4 py-4">
            <p className="text-gray-300 text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Action Buttons */}
        {currentUser && currentUser.id !== userId && (
          <div className="flex gap-3">
            {isFriend ? (
              <div className="flex-1 flex gap-3">
                <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-gray-800 text-gray-400 text-sm font-medium">
                  <Check className="w-4 h-4 text-[#00fea3]" />
                  Friends
                </div>
                <Button
                  onClick={() => navigate(createPageUrl('Chat') + `?userId=${userId}`)}
                  className="flex-1 py-6 rounded-full bg-[#00fea3] text-[#0b0b0b] font-bold hover:bg-[#00fea3]/90"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            ) : isPending ? (
              <div className="flex-1 flex items-center justify-center py-3 rounded-full bg-gray-800 text-gray-400 text-sm font-medium">
                Request Sent
              </div>
            ) : (
              <Button
                onClick={() => addFriendMutation.mutate()}
                disabled={addFriendMutation.isPending}
                className="flex-1 py-6 rounded-full bg-[#00fea3] text-[#0b0b0b] font-bold hover:bg-[#00fea3]/90"
              >
                {addFriendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* My Vibes */}
        {profile.vibes?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Music2 className="w-4 h-4 text-[#00fea3]" />
              <h3 className="text-white font-semibold text-sm uppercase tracking-widest">My Vibes</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.vibes.map((vibe, i) => {
                const cfg = vibeConfig[vibe];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <VibeTag vibe={vibe} size="lg" selected />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Preferred Parties */}
        {profile.party_types?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#542b9b]" />
              <h3 className="text-white font-semibold text-sm uppercase tracking-widest">Preferred Parties</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.party_types.map((type, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <PartyTag tag={type} size="md" selected />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ReportUserModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={(data) => reportUserMutation.mutate(data)}
        userName={profile?.display_name}
        isLoading={reportUserMutation.isPending}
      />

      <BlockUserModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onBlock={() => blockUserMutation.mutate()}
        userName={profile?.display_name}
        isLoading={blockUserMutation.isPending}
      />
    </div>
  );
}
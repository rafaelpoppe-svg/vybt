import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, UserPlus, MessageCircle, Check, Loader2, MapPin, Users,
  PartyPopper, Clapperboard, Music2, Sparkles, MoreVertical, Flag, Ban,
  Lock, Camera, ShieldCheck
} from 'lucide-react';
import VibeTag from '../components/common/VibeTag';
import PartyTag from '../components/common/PartyTag';
import BottomNav from '../components/common/BottomNav';
import VerificationBadge from '../components/profile/VerificationBadge';
import { notifyFriendRequest } from '../components/notifications/NotificationTriggers';
import ReportUserModal from '../components/user/ReportUserModal';
import BlockUserModal from '../components/user/BlockUserModal';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NATIONALITIES } from '../components/onboarding/NationalitySelect';

const THEME_BACKGROUNDS = {
  default:   'linear-gradient(160deg, #0b0b0b 0%, #111118 100%)',
  beer:      'linear-gradient(160deg, #1a0e00 0%, #0b0b0b 50%, #0b0b0b 100%)',
  dance:     'linear-gradient(160deg, #1a0a2e 0%, #0b0b0b 50%, #0b0b0b 100%)',
  champagne: 'linear-gradient(160deg, #1c1500 0%, #0b0b0b 50%, #0b0b0b 100%)',
  money:     'linear-gradient(160deg, #001a0a 0%, #0b0b0b 50%, #0b0b0b 100%)',
  luxury:    'linear-gradient(160deg, #0a0a1f 0%, #0b0b0b 50%, #0b0b0b 100%)',
  party:     'linear-gradient(160deg, #1a0010 0%, #0b0b0b 50%, #0b0b0b 100%)',
};

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');

  const [currentUser, setCurrentUser] = useState(null);
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [activeTab, setActiveTab] = useState('stories');

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: userId }),
    select: (data) => data[0],
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendshipStatus', currentUser?.id, userId],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, friend_id: userId }),
    enabled: !!currentUser?.id && !!userId,
    staleTime: 30_000,
  });

  const { data: userFriendships = [] } = useQuery({
    queryKey: ['userFriendships', userId],
    queryFn: () => base44.entities.Friendship.filter({ user_id: userId, status: 'accepted' }),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: participations = [] } = useQuery({
    queryKey: ['userParticipations', userId],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: userId }),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['userStories', userId],
    queryFn: () => base44.entities.ExperienceStory.filter({ user_id: userId }),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ['allPlansForUser'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 100),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const existingFriendship = friendships[0];
  const isFriend = existingFriendship?.status === 'accepted';
  const isPending = existingFriendship?.status === 'pending';
  const isPrivate = profile?.is_private && !isFriend && currentUser?.id !== userId;

  const userPlans = allPlans.filter(plan =>
    participations.some(p => p.plan_id === plan.id) &&
    ['upcoming', 'happening'].includes(plan.status)
  );

  const reportUserMutation = useMutation({
    mutationFn: ({ reason, details }) => base44.entities.Report.create({
      reporter_user_id: currentUser.id,
      reported_user_id: userId,
      type: 'user', reason, details: details || '', status: 'pending'
    }),
    onSuccess: () => { setShowReportModal(false); toast.success('Denúncia enviada'); }
  });

  const blockUserMutation = useMutation({
    mutationFn: () => base44.entities.BlockedUser.create({ user_id: currentUser.id, blocked_user_id: userId }),
    onSuccess: () => { setShowBlockModal(false); toast.success('Utilizador bloqueado'); navigate(-1); }
  });

  const addFriendMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Friendship.create({ user_id: currentUser.id, friend_id: userId, status: 'pending' });
      const myProfiles = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
      const myName = myProfiles[0]?.display_name || currentUser.full_name || 'Alguém';
      await notifyFriendRequest(userId, currentUser.id, myName);
    },
    onSuccess: () => queryClient.invalidateQueries(['friendshipStatus', currentUser?.id, userId])
  });

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
      </div>
    );
  }

  const photos = profile.photos?.filter(Boolean) || [];
  const hasPhotos = photos.length > 0;
  const nationalityInfo = profile.nationality ? NATIONALITIES.find(n => n.code === profile.nationality) : null;
  const age = profile.date_of_birth
    ? Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const tabs = [
    { id: 'stories', icon: <Clapperboard className="w-5 h-5" /> },
    { id: 'plans', icon: <PartyPopper className="w-5 h-5" /> },
    { id: 'friends', icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div
      className="min-h-screen overflow-y-auto overflow-x-hidden pb-24"
      style={{ background: THEME_BACKGROUNDS[profile.profile_background_theme] || THEME_BACKGROUNDS.default, WebkitOverflowScrolling: 'touch' }}
    >

      {/* ── Top Bar ── */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2 rounded-full bg-black/40 backdrop-blur-md">
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>

        <div className="flex items-center gap-2">
          {nationalityInfo && (
            <div className="flex items-center gap-1 bg-gray-800/70 rounded-full px-2.5 py-1">
              <span className="text-base leading-none">{nationalityInfo.flag}</span>
              <span className="text-xs text-gray-300 font-medium">{nationalityInfo.name}</span>
            </div>
          )}
          {currentUser && currentUser.id !== userId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} className="p-2 rounded-full bg-black/40 backdrop-blur-md">
                  <MoreVertical className="w-5 h-5 text-white" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800">
                <DropdownMenuItem onClick={() => setShowReportModal(true)} className="text-orange-400 hover:text-orange-300">
                  <Flag className="w-4 h-4 mr-2" /> Denunciar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowBlockModal(true)} className="text-red-400 hover:text-red-300">
                  <Ban className="w-4 h-4 mr-2" /> Bloquear
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="px-4 pb-4">
        <div className="flex gap-4 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {hasPhotos ? (
              <img
                src={photos[0]}
                alt="profile"
                onClick={() => setExpandedPhoto(photos[0])}
                className="w-24 h-28 rounded-2xl object-cover border border-gray-700 cursor-pointer"
              />
            ) : (
              <div className="w-24 h-28 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-600" />
              </div>
            )}
          </div>

          {/* Name + Stats */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-white text-lg leading-tight">{profile.display_name}</h2>
              {age && <span className="text-sm font-semibold text-[#00c6d2]">{age}y</span>}
              {profile.is_verified && <ShieldCheck className="w-4 h-4 text-blue-400" />}
              {isPrivate && <Lock className="w-3.5 h-3.5 text-gray-500" />}
            </div>

            <div className="flex gap-5 mt-3">
              {[
                { value: stories.length, label: 'stories' },
                { value: userFriendships.length, label: 'friends' },
                { value: participations.length, label: 'plans' },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center">
                  <p className="text-lg font-bold text-white leading-tight">{isPrivate ? '—' : value}</p>
                  <p className="text-xs text-gray-400 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {profile.bio && (
              <p className="text-xs text-gray-300 mt-2 line-clamp-3">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        {currentUser && currentUser.id !== userId && (
          <div className="flex gap-3 mt-4">
            {isFriend ? (
              <>
                <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 text-sm font-semibold">
                  <Check className="w-4 h-4" />
                  Friends
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(createPageUrl('Chat') + `?userId=${userId}`)}
                  className="flex-1 py-2.5 bg-[#7c3aed] rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </motion.button>
              </>
            ) : isPending ? (
              <div className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm font-medium border border-gray-700">
                Request Sent
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => addFriendMutation.mutate()}
                disabled={addFriendMutation.isPending}
                className="flex-1 py-2.5 bg-[#00c6d2]/20 border border-[#00c6d2]/50 rounded-xl text-[#00c6d2] text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                {addFriendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><UserPlus className="w-4 h-4" /> Add Friend</>
                )}
              </motion.button>
            )}
          </div>
        )}

        {/* ── Extra photos strip ── */}
        {!isPrivate && photos.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide" data-hscroll="1">
            {photos.slice(1).map((photo, i) => (
              <motion.img
                key={i}
                whileTap={{ scale: 0.96 }}
                src={photo}
                alt={`photo-${i + 2}`}
                onClick={() => setExpandedPhoto(photo)}
                className="w-24 h-32 rounded-xl object-cover flex-shrink-0 border border-gray-800 cursor-pointer"
              />
            ))}
          </div>
        )}

        {/* ── Vibes ── */}
        {profile.vibes?.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Music2 className="w-4 h-4 text-[#00c6d2]" />
              <span className="text-sm font-semibold text-white">Vibes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.vibes.map(vibe => <VibeTag key={vibe} vibe={vibe} size="sm" />)}
            </div>
          </div>
        )}
      </div>

      {/* ── Private Profile Gate for tabs ── */}
      {isPrivate ? (
        <div className="mx-4 mt-4 py-12 flex flex-col items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-2xl">
          <Lock className="w-8 h-8 text-gray-500" />
          <p className="text-white font-semibold text-sm">Perfil Privado</p>
          <p className="text-gray-500 text-xs text-center px-6">Adiciona este utilizador como amigo para ver os seus stories, planos e amigos.</p>
        </div>
      ) : (
        <>
          {/* ── Tabs ── */}
          <div className="sticky top-0 z-30 bg-[#0b0b0b] border-b border-gray-800 flex">
            {tabs.map(tab => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${
                  activeTab === tab.id ? 'border-[#00c6d2] text-[#00c6d2]' : 'border-transparent text-gray-500'
                }`}
              >
                {tab.icon}
              </motion.button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          <AnimatePresence mode="wait">
            {activeTab === 'stories' && (
              <motion.div key="stories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-3 gap-0.5 p-0.5">
                {stories.length === 0 ? (
                  <p className="col-span-3 text-center text-gray-500 text-sm py-10">No stories yet</p>
                ) : (
                  stories.map(story => (
                    <div key={story.id} className="aspect-square bg-gray-900 relative overflow-hidden">
                      <img src={story.media_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'plans' && (
              <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-3">
                {userPlans.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-10">No active plans</p>
                ) : (
                  userPlans.map(plan => (
                    <motion.button
                      key={plan.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
                      className="w-full p-3 bg-gray-900 rounded-xl border border-gray-800 text-left flex gap-3 items-center"
                    >
                      {plan.cover_image ? (
                        <img src={plan.cover_image} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <PartyPopper className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{plan.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{plan.city} · {new Date(plan.date).toLocaleDateString()}</p>
                      </div>
                    </motion.button>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'friends' && (
              <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
                <p className="text-center text-gray-500 text-sm py-10">{userFriendships.length} friends</p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Photo Expand Modal ── */}
      <AnimatePresence>
        {expandedPhoto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setExpandedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <motion.img
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              src={expandedPhoto}
              className="max-w-full max-h-full rounded-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

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
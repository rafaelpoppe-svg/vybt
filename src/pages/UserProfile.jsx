import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, MapPin, Camera, Loader2, MessageCircle, Check, 
  UserPlus, ShieldCheck, Lock, Music2, Grid3X3, Ban, Flag, MoreVertical, PartyPopper, UserMinus
} from 'lucide-react';
import VibeTag from '../components/common/VibeTag';
import PartyTag from '../components/common/PartyTag';
import { NATIONALITIES } from '../components/onboarding/NationalitySelect';
import ProfileStoryGrid from '../components/profile/ProfileStoryGrid';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const THEME_BACKGROUNDS = {
  default: 'var(--bg)',
  beer: 'linear-gradient(135deg, #2d1810 0%, #5c3d2e 100%)',
  dance: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 100%)',
  champagne: 'linear-gradient(135deg, #3d3d2e 0%, #5c5c42 100%)',
  money: 'linear-gradient(135deg, #1a2e1a 0%, #2d5c2d 100%)',
  luxury: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  party: 'linear-gradient(135deg, #2e1a2e 0%, #5c2d5c 100%)',
};

const THEME_ACCENTS = {
  default: '#00c6d2', beer: '#f59e0b', dance: '#8b5cf6',
  champagne: '#d4af37', money: '#22c55e', luxury: '#6366f1', party: '#ec4899',
};

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');

  const [activeTab, setActiveTab] = useState('photos');
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [showUnfriendModal, setShowUnfriendModal] = useState(false);
  const [friendshipLoading, setFriendshipLoading] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: userId }).then(r => r[0]),
    enabled: !!userId,
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['userStories', userId],
    queryFn: () => base44.entities.ExperienceStory.filter({ user_id: userId }),
    enabled: !!userId,
  });

  const { data: participations = [] } = useQuery({
    queryKey: ['userParticipations', userId],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: userId }),
    enabled: !!userId,
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 100),
    enabled: !!userId,
    staleTime: 60000,
  });

  const { data: userFriendships = [] } = useQuery({
    queryKey: ['userFriendships', userId],
    queryFn: () => base44.entities.Friendship.filter({ user_id: userId, status: 'accepted' }),
    enabled: !!userId,
  });

  const { data: myFriendships = [] } = useQuery({
    queryKey: ['myFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id,
  });

  // Pedidos que RECEBI desta pessoa (ela enviou para mim)
  const { data: receivedFromUser = [] } = useQuery({
    queryKey: ['receivedFromUser', currentUser?.id, userId],
    queryFn: () => base44.entities.Friendship.filter({ user_id: userId, friend_id: currentUser?.id, status: 'pending' }),
    enabled: !!currentUser?.id && !!userId,
  });

  const userPlans = allPlans.filter(p => participations.some(pa => pa.plan_id === p.id));





  // Only block on profile — currentUser loads async but isn't needed to show the profile
  if (profileLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{background: 'var(--bg)'}}
      >
        <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{background: 'var(--bg)'}}  
      >
        <p className="text-5xl">👤</p>
        <p className="text-white font-semibold">Profile not found</p>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="text-[#00c6d2] text-sm font-medium">
          Go back
        </motion.button>
      </div>
    );
  }

  const photos = profile.photos?.filter(Boolean) || [];
  const nationalityInfo = profile.nationality ? NATIONALITIES.find(n => n.code === profile.nationality) : null;
  const age = profile.date_of_birth
    ? Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const theme = profile.profile_background_theme || 'default';
  const accent = THEME_ACCENTS[theme] || '#00c6d2';
  const coverPhoto = photos[0];
  const isPrivate = profile.is_private;
  const isFriend = myFriendships.some(f => (f.friend_id === userId || f.user_id === userId) && f.status === 'accepted');
  const isPending = myFriendships.some(f => f.friend_id === userId && f.status === 'pending');
  const existingFriendship = myFriendships.find(f => (f.friend_id === userId || f.user_id === userId));
  // Pedido que recebi desta pessoa (ela quer ser minha amiga)
  const incomingRequest = receivedFromUser[0] || null;

  const handleAddFriend = async () => {
    if (isPending || incomingRequest) return; // evitar duplicado
    setFriendshipLoading(true);
    const myProfile = await base44.entities.UserProfile.filter({ user_id: currentUser.id }).then(r => r[0]);
    await base44.entities.Friendship.create({
      user_id: currentUser.id,
      friend_id: userId,
      status: 'pending',
    });
    // Notificar a outra pessoa
    const { notifyFriendRequest } = await import('../components/notifications/NotificationTriggers');
    await notifyFriendRequest(userId, currentUser.id, myProfile?.display_name || currentUser.full_name || 'Alguém');
    await queryClient.invalidateQueries(['myFriendships', currentUser?.id]);
    setFriendshipLoading(false);
  };

  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;
    setFriendshipLoading(true);
    // Aceitar o pedido da outra pessoa
    await base44.entities.Friendship.update(incomingRequest.id, { status: 'accepted' });
    // Criar amizade simétrica para o utilizador atual (se não existir)
    const existing = myFriendships.find(f => f.friend_id === userId && f.status === 'accepted');
    if (!existing) {
      await base44.entities.Friendship.create({
        user_id: currentUser.id,
        friend_id: userId,
        status: 'accepted',
      });
    }
    await queryClient.invalidateQueries(['myFriendships', currentUser?.id]);
    await queryClient.invalidateQueries(['receivedFromUser', currentUser?.id, userId]);
    await queryClient.invalidateQueries(['userFriendships', userId]);
    setFriendshipLoading(false);
  };

  const handleDeclineRequest = async () => {
    if (!incomingRequest) return;
    setFriendshipLoading(true);
    await base44.entities.Friendship.update(incomingRequest.id, { status: 'declined' });
    await queryClient.invalidateQueries(['receivedFromUser', currentUser?.id, userId]);
    setFriendshipLoading(false);
  };

  const handleUnfriend = async () => {
    setFriendshipLoading(true);
    if (existingFriendship) {
      await base44.entities.Friendship.delete(existingFriendship.id);
    }
    // Apagar também o lado inverso
    const inverseFriendships = await base44.entities.Friendship.filter({ user_id: userId, friend_id: currentUser.id });
    for (const f of inverseFriendships) {
      await base44.entities.Friendship.delete(f.id);
    }
    await queryClient.invalidateQueries(['myFriendships', currentUser?.id]);
    await queryClient.invalidateQueries(['userFriendships', userId]);
    setFriendshipLoading(false);
    setShowUnfriendModal(false);
  };

  const tabs = [
    { id: 'photos', icon: <Grid3X3 className="w-5 h-5" /> },
    { id: 'stories', icon: <Camera className="w-5 h-5" /> },
    { id: 'plans', icon: <PartyPopper className="w-5 h-5" /> },
  ];

  return (
    <div
      className="min-h-screen overflow-y-auto overflow-x-hidden pb-24 safe-top"
      style={{ background: THEME_BACKGROUNDS[theme] || THEME_BACKGROUNDS.default, WebkitOverflowScrolling: 'touch' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2 rounded-full bg-black/40 backdrop-blur-md">
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        {/* Username in header */}
        <div className="flex flex-col items-center absolute left-0 right-0 pointer-events-none">
          <span className="text-white font-black text-base tracking-tight">
            {profile.username ? `@${profile.username}` : profile.display_name}
          </span>
          {profile.username && (
            <span className="text-gray-500 text-xs">{profile.display_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 relative z-10">
          {nationalityInfo && (
            <div className="flex items-center gap-1 bg-gray-800/70 rounded-full px-2 py-0.5">
              <span className="text-sm leading-none">{nationalityInfo.flag}</span>
              <span className="text-[11px] text-gray-300 font-medium">{nationalityInfo.name}</span>
            </div>
          )}
          {currentUser && currentUser.id !== userId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} className="relative z-10 p-2 rounded-full bg-black/40 backdrop-blur-md">
                  <MoreVertical className="w-5 h-5 text-white" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800">
                <DropdownMenuItem className="text-orange-400 hover:text-orange-300">
                  <Flag className="w-4 h-4 mr-2" /> Denunciar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400 hover:text-red-300">
                  <Ban className="w-4 h-4 mr-2" /> Bloquear
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <motion.div whileTap={{ scale: 0.96 }} onClick={() => coverPhoto && setExpandedPhoto(coverPhoto)} className="relative flex-shrink-0">
            <div
              className="w-[82px] h-[82px] rounded-full p-[2.5px]"
              style={{ background: `linear-gradient(135deg, ${accent}, #542b9b)` }}
            >
              {coverPhoto ? (
                <img src={coverPhoto} className="w-full h-full rounded-full object-cover border-2 border-[#0b0b0b]" />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-800 border-2 border-[#0b0b0b] flex items-center justify-center">
                  <Camera className="w-7 h-7 text-gray-500" />
                </div>
              )}
            </div>
            {profile.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#0b0b0b]">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </motion.div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-3 gap-1 text-center">
            <div className="flex flex-col items-center">
              <span className="font-black text-xl leading-tight" style={{ color: accent }}>{userPlans.length}</span>
              <span className="text-xs font-semibold" style={{ color: accent }}>Plans</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-xl leading-tight">{isPrivate ? '—' : userFriendships.length}</span>
              <span className="text-gray-500 text-xs">Friends</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-xl leading-tight">{isPrivate ? '—' : stories.length}</span>
              <span className="text-gray-500 text-xs">Stories</span>
            </div>
          </div>
        </div>

        {/* Name + details */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-bold text-base leading-tight">
              {profile.display_name}
            </span>
            {age && <span className="text-sm font-bold" style={{ color: accent }}>{age}</span>}
            {profile.gender && <span className="text-xs text-gray-500">{profile.gender}</span>}
            {profile.is_verified && <ShieldCheck className="w-4 h-4 text-blue-400" />}
            {isPrivate && <Lock className="w-3.5 h-3.5 text-gray-500" />}
          </div>

          {profile.city && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">{profile.city}</span>
            </div>
          )}

          {profile.bio && (
            <p className="text-sm text-gray-300 mt-1.5 leading-relaxed">{profile.bio}</p>
          )}

          {/* Vibes */}
          {profile.vibes?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.vibes.map(vibe => <VibeTag key={vibe} vibe={vibe} size="sm" />)}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {currentUser && currentUser.id !== userId && (
          <div className="flex gap-3 mt-4">
            {isFriend ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUnfriendModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 text-sm font-semibold"
                >
                  <Check className="w-4 h-4" />
                  Friends
                </motion.button>
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
                ⏳ Request Sent
              </div>
            ) : incomingRequest ? (
              // Esta pessoa enviou-nos um pedido — mostrar Aceitar/Recusar
              <div className="flex gap-2 flex-1">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAcceptRequest}
                  disabled={friendshipLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 text-white"
                  style={{ background: 'linear-gradient(135deg, #00c6d2, #542b9b)' }}
                >
                  {friendshipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Accept</>}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeclineRequest}
                  disabled={friendshipLoading}
                  className="flex-1 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  Decline
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddFriend}
                disabled={friendshipLoading}
                className="flex-1 py-2.5 bg-[#00c6d2]/20 border border-[#00c6d2]/50 rounded-xl text-[#00c6d2] text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {friendshipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Add Friend</>}
              </motion.button>
            )}
          </div>
        )}

        {/* Extra photos strip */}
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

        {/* Party Types */}
        {profile.party_types?.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-white">Party Types</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.party_types.map(type => <PartyTag key={type} tag={type} size="sm" />)}
            </div>
          </div>
        )}
      </div>

      {/* Private Profile Gate for tabs */}
      {isPrivate ? (
        <div className="mx-4 mt-4 py-12 flex flex-col items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-2xl">
          <Lock className="w-8 h-8 text-gray-500" />
          <p className="text-white font-semibold text-sm">Perfil Privado</p>
          <p className="text-gray-500 text-xs text-center px-6">Adiciona este utilizador como amigo para ver os seus stories, planos e amigos.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div 
            className="sticky top-0 z-30 backdrop-blur-md border-b border-white/8"
            style={{background: 'var(--bg)', opacity: 0.9}}
          >
            <div className="flex">
              {tabs.map(tab => (
                <motion.button key={tab.id} whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex-1 py-3 flex items-center justify-center transition-colors"
                  style={{ color: activeTab === tab.id ? accent : '#4b5563' }}
                >
                  {tab.icon}
                  {activeTab === tab.id && (
                    <motion.div layoutId="tab-underline"
                      className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                      style={{ background: accent }} />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'photos' && (
              <motion.div key="photos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {photos.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <p className="text-5xl">🖼️</p>
                    <p className="text-gray-400 font-semibold">No photos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-[1px]">
                    {photos.map((photo, i) => (
                      <motion.div key={i} whileTap={{ scale: 0.97 }} onClick={() => setExpandedPhoto(photo)}
                        className="aspect-square overflow-hidden cursor-pointer">
                        <img src={photo} className="w-full h-full object-cover" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'stories' && (
              <motion.div key="stories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {stories.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <p className="text-5xl">📸</p>
                    <p className="text-gray-400 font-semibold">No stories</p>
                  </div>
                ) : (
                  <ProfileStoryGrid
                    stories={stories}
                    onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
                  />
                )}
              </motion.div>
            )}

            {activeTab === 'plans' && (
              <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-3">
                {userPlans.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <p className="text-5xl">🎉</p>
                    <p className="text-gray-400 font-semibold">No plans</p>
                  </div>
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
          </AnimatePresence>
        </>
      )}

      {/* Unfriend Confirmation Modal */}
      <AnimatePresence>
        {showUnfriendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUnfriendModal(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-3xl p-6 space-y-4"
              style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #111 100%)', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}
            >
              <div className="flex justify-center">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">💔</div>
                <h3 className="text-white font-bold text-lg">Remove Friend?</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Are you sure you want to remove <span className="text-white font-semibold">{profile?.display_name}</span> from your friends?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowUnfriendModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-gray-800 text-gray-300 font-semibold text-sm border border-gray-700"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleUnfriend}
                  disabled={friendshipLoading}
                  className="flex-1 py-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {friendshipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserMinus className="w-4 h-4" /> Remove</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Expand Modal */}
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


    </div>
  );
}
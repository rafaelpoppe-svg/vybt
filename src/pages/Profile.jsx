import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Camera, Loader2, Bell, Settings, ShieldCheck, ShieldX,
  PartyPopper, Users, Trophy, Star, MapPin,
  Calendar, ChevronRight, Edit2, Images, Grid3X3
} from 'lucide-react';
import BottomNav from '../components/common/BottomNav';
import VibeTag from '../components/common/VibeTag';
import PartyTag from '../components/common/PartyTag';
import VerificationFlow from '../components/profile/VerificationFlow';
import { useLanguage } from '../components/common/LanguageContext';
import { useProfileThemeContext } from '../components/common/ProfileThemeContext';
import { NATIONALITIES } from '../components/onboarding/NationalitySelect';
import ProfileStoryGrid from '../components/profile/ProfileStoryGrid';
import FriendsListModal from '../components/profile/FriendsListModal';
import { format } from 'date-fns';

const THEME_ACCENTS = {
  default: '#00c6d2', beer: '#f59e0b', dance: '#8b5cf6',
  champagne: '#d4af37', money: '#22c55e', luxury: '#6366f1', party: '#ec4899',
};

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setProfileTheme } = useProfileThemeContext();
  const [showVerification, setShowVerification] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [showFriends, setShowFriends] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: profile } = useQuery({
    queryKey: ['myProfile', currentUser?.id],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: currentUser.id }),
    select: d => d[0],
    enabled: !!currentUser?.id,
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['myFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser.id, status: 'accepted' }),
    enabled: !!currentUser?.id,
  });

  const { data: participations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser.id }),
    enabled: !!currentUser?.id,
  });

  const { data: myStories = [] } = useQuery({
    queryKey: ['myStories', currentUser?.id],
    queryFn: () => base44.entities.ExperienceStory.filter({ user_id: currentUser.id }),
    enabled: !!currentUser?.id,
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 100),
    enabled: !!currentUser?.id,
    staleTime: 60000,
  });

  const { data: myCommunityMemberships = [] } = useQuery({
    queryKey: ['myCommunityMembershipsProfile', currentUser?.id],
    queryFn: () => base44.entities.CommunityMember.filter({ user_id: currentUser.id }),
    enabled: !!currentUser?.id,
  });

  const { data: allCommunities = [] } = useQuery({
    queryKey: ['allCommunitiesProfile'],
    queryFn: () => base44.entities.Community.list('-created_date', 100),
    enabled: myCommunityMemberships.length > 0,
  });

  const friendIds = friendships.map(f => f.friend_id);
  const { data: friendProfiles = [] } = useQuery({
    queryKey: ['friendProfiles', friendIds.join(',')],
    queryFn: async () => (await Promise.all(friendIds.map(id => base44.entities.UserProfile.filter({ user_id: id })))).flat(),
    enabled: friendIds.length > 0,
  });

  const myCommunities = allCommunities.filter(c =>
    myCommunityMemberships.some(m => m.community_id === c.id) && !c.is_deleted && !c.deletion_scheduled_at
  );
  const myPlans = allPlans.filter(plan => participations.some(p => p.plan_id === plan.id));
  const activePlans = myPlans.filter(plan => ['upcoming', 'happening'].includes(plan.status));
  const pastPlans = myPlans.filter(plan => ['ended', 'renewed', 'voting'].includes(plan.status));

  useEffect(() => {
    if (profile?.profile_background_theme) setProfileTheme(profile.profile_background_theme);
  }, [profile?.profile_background_theme]);

  // Only block render while we don't have the profile yet (currentUser loads fast from cache)
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
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

  const tabs = [
    { id: 'photos',      icon: <Grid3X3 className="w-5 h-5" />,      count: photos.length },
    { id: 'stories',     icon: <Camera className="w-5 h-5" />,       count: myStories.length },
    { id: 'communities', icon: <Star className="w-5 h-5" />,         count: myCommunities.length },
  ];

  return (
    <div 
      className="h-screen bg-[#0b0b0b] overflow-hidden flex flex-col">

      {/* ── Top bar ── */}
      <div
        className="relative flex-shrink-0 flex items-center justify-between px-4 py-3 z-40 bg-[#0b0b0b]/90 backdrop-blur-md border-b border-white/5"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <div className="w-10" />
        <div className="absolute left-0 right-0 flex items-center justify-center gap-2 pointer-events-none">
          <span className="text-white font-black text-xl tracking-tight">
            {profile.display_name || currentUser.full_name}
          </span>
          {profile.is_verified ? (
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          ) : (
            <span className="text-[11px] text-gray-500 font-medium">Not verified</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(createPageUrl('Notifications'))}
            className="p-2 rounded-xl bg-white/5 relative">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(createPageUrl('Settings'))}
            className="p-2 rounded-xl bg-white/5">
            <Settings className="w-5 h-5 text-gray-300" />
          </motion.button>
        </div>
      </div>

      {/* ── Instagram-style header ── */}
      <div className="px-4 pt-5 pb-4 flex-shrink-0">
        {/* Avatar row + stats */}
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
            <StatCol value={myPlans.length} label="Plans" onClick={() => navigate(createPageUrl('MyPlans'))} accent={accent} />
            <StatCol value={friendships.length} label="Friends" onClick={() => setShowFriends(true)} accent={accent} />
            <StatCol value={myStories.length} label="Stories" />
          </div>
        </div>

        {/* Name + details */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-bold text-base leading-tight">
              {profile.display_name || currentUser.full_name}
            </span>
            {age && <span className="text-sm font-bold" style={{ color: accent }}>{age}</span>}
            {profile.gender && <span className="text-xs text-gray-500">{profile.gender}</span>}
            {nationalityInfo && <span className="text-base leading-none">{nationalityInfo.flag}</span>}
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
        <div className="flex gap-2 mt-4">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(createPageUrl('EditProfile'))}
            className="flex-1 py-2 rounded-xl text-sm font-bold bg-white/10 text-white border border-white/10 flex items-center justify-center gap-1.5">
            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
          </motion.button>

          {profile.ambassador_opted_in && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(createPageUrl('Ambassador'))}
              className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff' }}>
              <Trophy className="w-3.5 h-3.5" /> Ambassador
            </motion.button>
          )}

          {!profile.is_verified && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowVerification(true)}
              className="py-2 px-3 rounded-xl border border-white/10 bg-white/5 flex items-center gap-1">
              <ShieldX className="w-4 h-4 text-gray-400" />
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Tabs (Instagram icon tabs) ── */}
      <div className="flex-shrink-0 z-30 bg-[#0b0b0b]/90 backdrop-blur-md border-b border-white/8">
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
              {tab.count > 0 && activeTab !== tab.id && (
                <span className="absolute top-1.5 right-3 text-[9px] font-black w-3.5 h-3.5 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center">
                  {tab.count > 9 ? '9+' : tab.count}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto pb-28">
      <AnimatePresence mode="wait">

        {/* Photos grid */}
        {activeTab === 'photos' && (
          <motion.div key="photos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {photos.length === 0 ? (
              <EmptyState emoji="🖼️" text="No photos yet" subtext="Add photos in Edit Profile" />
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

        {/* Stories grid */}
        {activeTab === 'stories' && (
          <motion.div key="stories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {myStories.length === 0 ? (
              <EmptyState emoji="📸" text="No stories yet" subtext="Share moments from your plans!" />
            ) : (
              <ProfileStoryGrid
                stories={myStories}
                onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
              />
            )}
          </motion.div>
        )}

        {/* Communities */}
        {activeTab === 'communities' && (
          <motion.div key="communities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-3">
            {myCommunities.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-4xl">⭐</p>
                <p className="text-gray-500 text-sm">No communities yet</p>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(createPageUrl('Explore') + '?tab=communities')}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: `linear-gradient(135deg, ${accent}, #542b9b)`, color: '#fff' }}>
                  Explore Communities
                </motion.button>
              </div>
            ) : (
              myCommunities.map(community => {
                const tc = community.theme_color || '#00c6d2';
                const membership = myCommunityMemberships.find(m => m.community_id === community.id);
                return (
                  <motion.button key={community.id} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(createPageUrl('CommunityView') + `?id=${community.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                    style={{ background: `${tc}0a`, border: `1px solid ${tc}25` }}>
                    {community.cover_image ? (
                      <img src={community.cover_image} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${tc}20` }}>⭐</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white truncate text-sm">{community.name}</p>
                        {membership?.role === 'admin' && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: `${tc}30`, color: tc }}>ADMIN</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <MapPin className="w-2.5 h-2.5" style={{ color: tc }} />{community.city}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Users className="w-2.5 h-2.5" style={{ color: tc }} />{community.member_count || 0}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  </motion.button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* ── Photo Expand Modal ── */}
      <AnimatePresence>
        {expandedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setExpandedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
            <motion.img initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              src={expandedPhoto} className="max-w-full max-h-full rounded-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>

      <FriendsListModal
        isOpen={showFriends}
        onClose={() => setShowFriends(false)}
        friendProfiles={friendProfiles}
        accent={accent}
      />

      <BottomNav />

      <VerificationFlow
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        userProfile={profile}
        onVerificationComplete={() => setShowVerification(false)}
      />
    </div>
  );
}

function StatCol({ value, label, onClick, accent }) {
  if (onClick) {
    return (
      <motion.button whileTap={{ scale: 0.93 }} onClick={onClick} className="flex flex-col items-center">
        <span className="font-black text-xl leading-tight" style={{ color: accent }}>{value}</span>
        <span className="text-xs font-semibold" style={{ color: accent }}>{label}</span>
      </motion.button>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <span className="text-white font-black text-xl leading-tight">{value}</span>
      <span className="text-gray-500 text-xs">{label}</span>
    </div>
  );
}

function PlanRow({ plan, accent, onClick, past = false }) {
  let dateLabel = '';
  try { dateLabel = plan.date ? format(new Date(plan.date), 'EEE, MMM d') : ''; } catch (_) {}
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
      style={{ background: past ? 'rgba(255,255,255,0.02)' : `${accent}0d`, border: `1px solid ${past ? 'rgba(255,255,255,0.05)' : accent + '25'}` }}>
      {plan.cover_image ? (
        <img src={plan.cover_image} className={`w-12 h-12 rounded-xl object-cover flex-shrink-0 ${past ? 'opacity-50 grayscale' : ''}`} />
      ) : (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${past ? 'opacity-40' : ''}`}
          style={{ background: past ? '#1f2937' : `${accent}20` }}>🎉</div>
      )}
      <div className="min-w-0 flex-1">
        <p className={`font-bold text-sm truncate ${past ? 'text-gray-400' : 'text-white'}`}>{plan.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1 text-[10px] text-gray-500"><MapPin className="w-2.5 h-2.5" />{plan.city}</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500"><Calendar className="w-2.5 h-2.5" />{dateLabel}</span>
        </div>
        {plan.status === 'happening' && (
          <span className="text-[10px] font-bold text-green-400 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" /> Live Now
          </span>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
    </motion.button>
  );
}

function EmptyState({ emoji, text, subtext }) {
  return (
    <div className="text-center py-16 space-y-2">
      <p className="text-5xl">{emoji}</p>
      <p className="text-gray-400 font-semibold">{text}</p>
      {subtext && <p className="text-gray-600 text-sm">{subtext}</p>}
    </div>
  );
}
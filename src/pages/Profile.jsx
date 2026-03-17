import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Camera, Loader2, Bell, Settings, ShieldCheck, ShieldX,
  PartyPopper, Users, Trophy, Music2, Star, MapPin,
  Calendar, ChevronRight, Globe, Edit2, Heart
} from 'lucide-react';
import BottomNav from '../components/common/BottomNav';
import VibeTag from '../components/common/VibeTag';
import PartyTag from '../components/common/PartyTag';
import VerificationBadge from '../components/profile/VerificationBadge';
import VerificationFlow from '../components/profile/VerificationFlow';
import { useLanguage } from '../components/common/LanguageContext';
import { useProfileThemeContext } from '../components/common/ProfileThemeContext';
import { NATIONALITIES } from '../components/onboarding/NationalitySelect';
import ProfileStoryGrid from '../components/profile/ProfileStoryGrid';
import { format } from 'date-fns';

const THEME_ACCENTS = {
  default: '#00c6d2',
  beer: '#f59e0b',
  dance: '#8b5cf6',
  champagne: '#d4af37',
  money: '#22c55e',
  luxury: '#6366f1',
  party: '#ec4899',
};

const THEME_BACKGROUNDS = {
  default: 'linear-gradient(160deg, #0b0b0b 0%, #111118 100%)',
  beer: 'linear-gradient(160deg, #1a0e00 0%, #0b0b0b 50%, #0b0b0b 100%)',
  dance: 'linear-gradient(160deg, #1a0a2e 0%, #0b0b0b 50%, #0b0b0b 100%)',
  champagne: 'linear-gradient(160deg, #1c1500 0%, #0b0b0b 50%, #0b0b0b 100%)',
  money: 'linear-gradient(160deg, #001a0a 0%, #0b0b0b 50%, #0b0b0b 100%)',
  luxury: 'linear-gradient(160deg, #0a0a1f 0%, #0b0b0b 50%, #0b0b0b 100%)',
  party: 'linear-gradient(160deg, #1a0010 0%, #0b0b0b 50%, #0b0b0b 100%)',
};

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setProfileTheme } = useProfileThemeContext();
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [activeTab, setActiveTab] = useState('stories');
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => navigate(createPageUrl('Onboarding')));
  }, []);

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

  // Sticky header collapse on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setHeaderCollapsed(el.scrollTop > 160);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (!currentUser || !profile) {
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
  const bgStyle = THEME_BACKGROUNDS[theme] || THEME_BACKGROUNDS.default;
  const coverPhoto = photos[0];

  const tabs = [
    { id: 'stories', label: 'Stories', icon: <Camera className="w-4 h-4" />, count: myStories.length },
    { id: 'plans', label: 'Plans', icon: <PartyPopper className="w-4 h-4" />, count: activePlans.length },
    { id: 'friends', label: 'Friends', icon: <Users className="w-4 h-4" />, count: friendships.length },
    { id: 'communities', label: 'Communities', icon: <Star className="w-4 h-4" />, count: myCommunities.length },
  ];

  return (
    <div
      ref={scrollRef}
      className="min-h-screen overflow-y-auto overflow-x-hidden pb-28"
      style={{ background: bgStyle, WebkitOverflowScrolling: 'touch' }}
    >
      {/* ── Floating Top Bar ── */}
      <div
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: headerCollapsed ? 'rgba(11,11,11,0.92)' : 'transparent',
          backdropFilter: headerCollapsed ? 'blur(16px)' : 'none',
          borderBottom: headerCollapsed ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: name when collapsed */}
          <AnimatePresence>
            {headerCollapsed ? (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2">
                {coverPhoto ? (
                  <img src={coverPhoto} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-800" />
                )}
                <span className="text-white font-bold text-sm">{profile.display_name || currentUser.full_name}</span>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {nationalityInfo ? (
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1">
                    <span className="text-base leading-none">{nationalityInfo.flag}</span>
                    <span className="text-xs text-gray-200 font-medium">{nationalityInfo.name}</span>
                  </div>
                ) : <div />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right: action icons */}
          <div className="flex items-center gap-1">
            {profile.is_verified ? (
              <div className="flex items-center gap-1 bg-blue-500/20 rounded-full px-2.5 py-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-blue-400 font-medium">Verified</span>
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowVerification(true)}
                className="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1">
                <ShieldX className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">Verify</span>
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(createPageUrl('Notifications'))}
              className="p-2 rounded-xl bg-black/40 backdrop-blur-md relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(createPageUrl('Settings'))}
              className="p-2 rounded-xl bg-black/40 backdrop-blur-md">
              <Settings className="w-5 h-5 text-gray-300" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Hero: Cover + Avatar ── */}
      <div className="relative -mt-14">
        {/* Cover strip from photos[1] or gradient */}
        <div className="w-full h-48 overflow-hidden">
          {photos[1] ? (
            <img src={photos[1]} className="w-full h-full object-cover" style={{ filter: 'brightness(0.55)' }} />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${accent}55, #542b9b55)` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b0b0b]" />
        </div>

        {/* Avatar overlapping cover */}
        <div className="absolute bottom-0 left-4 translate-y-1/2 z-10">
          <motion.div whileTap={{ scale: 0.97 }} onClick={() => coverPhoto && setExpandedPhoto(coverPhoto)}
            className="relative">
            {coverPhoto ? (
              <img src={coverPhoto} className="w-24 h-24 rounded-2xl object-cover border-2"
                style={{ borderColor: accent }} />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gray-800 border-2 flex items-center justify-center"
                style={{ borderColor: accent }}>
                <Camera className="w-8 h-8 text-gray-600" />
              </div>
            )}
            {profile.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#0b0b0b]">
                <ShieldCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Edit button top right of cover area */}
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(createPageUrl('EditProfile'))}
          className="absolute bottom-2 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: `${accent}22`, border: `1px solid ${accent}55`, color: accent }}>
          <Edit2 className="w-3 h-3" /> Edit Profile
        </motion.button>
      </div>

      {/* ── Identity Block ── */}
      <div className="px-4 mt-14 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-white">
                {profile.display_name || currentUser.full_name}
              </h1>
              {age && (
                <span className="text-base font-bold" style={{ color: accent }}>{age}</span>
              )}
              {profile.gender && (
                <span className="text-xs text-gray-400 font-medium">{profile.gender}</span>
              )}
            </div>
            {profile.city && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-400">{profile.city}</span>
              </div>
            )}
          </div>

          {/* Ambassador / Friends button */}
          {profile.ambassador_opted_in ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(createPageUrl('Ambassador'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff' }}>
              <Trophy className="w-3.5 h-3.5" /> Ambassador
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(createPageUrl('Friends'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-800 border border-gray-700 text-white">
              <Users className="w-3.5 h-3.5" /> Friends
            </motion.button>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-gray-300 mt-3 leading-relaxed">{profile.bio}</p>
        )}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { value: myStories.length, label: 'Stories', icon: '📸' },
            { value: friendships.length, label: 'Friends', icon: '👥' },
            { value: myPlans.length, label: 'Plans', icon: '🎉' },
            { value: myCommunities.length, label: 'Groups', icon: '⭐' },
          ].map(({ value, label, icon }) => (
            <div key={label} className="flex flex-col items-center py-3 rounded-xl"
              style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}>
              <span className="text-base mb-0.5">{icon}</span>
              <span className="text-lg font-black text-white leading-tight">{value}</span>
              <span className="text-[10px] text-gray-400 leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Photo Strip ── */}
        {photos.length > 1 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Photos</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" data-hscroll="1">
              {photos.slice(1).map((photo, i) => (
                <motion.img key={i} whileTap={{ scale: 0.94 }} src={photo}
                  onClick={() => setExpandedPhoto(photo)}
                  className="w-24 h-32 rounded-xl object-cover flex-shrink-0 border border-gray-800 cursor-pointer" />
              ))}
            </div>
          </div>
        )}

        {/* ── Vibes + Party types ── */}
        {(profile.vibes?.length > 0 || profile.party_types?.length > 0) && (
          <div className="mt-4 space-y-3">
            {profile.vibes?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Music2 className="w-3.5 h-3.5" style={{ color: accent }} />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Vibes</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.vibes.map(vibe => <VibeTag key={vibe} vibe={vibe} size="sm" />)}
                </div>
              </div>
            )}
            {profile.party_types?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Heart className="w-3.5 h-3.5" style={{ color: accent }} />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Party Types</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.party_types.map(tag => <PartyTag key={tag} tag={tag} size="sm" />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="sticky top-14 z-30 mt-4 px-4"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex gap-1 bg-black/60 backdrop-blur-lg rounded-2xl p-1 border border-white/5">
          {tabs.map(tab => (
            <motion.button key={tab.id} whileTap={{ scale: 0.94 }} onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 py-2 flex flex-col items-center gap-0.5 rounded-xl transition-all text-[10px] font-bold"
              style={activeTab === tab.id ? { background: `${accent}30`, color: accent } : { color: '#6b7280' }}>
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: activeTab === tab.id ? accent : '#374151', color: activeTab === tab.id ? '#0b0b0b' : '#9ca3af' }}>
                  {tab.count}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'stories' && (
          <motion.div key="stories" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3">
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

        {activeTab === 'plans' && (
          <motion.div key="plans" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-3 mt-1">
            {activePlans.length === 0 && pastPlans.length === 0 ? (
              <EmptyState emoji="🎉" text="No plans yet" subtext="Join a plan to see it here" />
            ) : (
              <>
                {activePlans.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Upcoming</p>
                    {activePlans.map(plan => <PlanRow key={plan.id} plan={plan} accent={accent} onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)} />)}
                  </>
                )}
                {pastPlans.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4">Past</p>
                    {pastPlans.slice(0, 5).map(plan => <PlanRow key={plan.id} plan={plan} accent={accent} onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)} past />)}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'friends' && (
          <motion.div key="friends" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 mt-1">
            {friendships.length === 0 ? (
              <EmptyState emoji="👥" text="No friends yet" subtext="Connect with people at plans" />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {friendProfiles.map(fp => (
                  <motion.button key={fp.user_id} whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(createPageUrl('UserProfile') + `?id=${fp.user_id}`)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
                    {fp.photos?.[0] ? (
                      <img src={fp.photos[0]} className="w-16 h-16 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white truncate max-w-[100px]">{fp.display_name || 'User'}</p>
                      {fp.city && <p className="text-[10px] text-gray-500 truncate">{fp.city}</p>}
                      {fp.vibes?.length > 0 && (
                        <p className="text-[10px] mt-0.5" style={{ color: accent }}>{fp.vibes.slice(0, 2).join(' · ')}</p>
                      )}
                    </div>
                    {fp.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'communities' && (
          <motion.div key="communities" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-3 mt-1">
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
                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-left overflow-hidden relative"
                    style={{ background: `${tc}0a`, border: `1px solid ${tc}30` }}>
                    {/* Cover strip bg */}
                    {community.cover_image && (
                      <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: `url(${community.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    )}
                    <div className="relative z-10 flex items-center gap-3 w-full">
                      {community.cover_image ? (
                        <img src={community.cover_image} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: `${tc}22` }}>⭐</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white truncate">{community.name}</p>
                          {membership?.role === 'admin' && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: `${tc}30`, color: tc }}>ADMIN</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <MapPin className="w-3 h-3" style={{ color: tc }} />
                            {community.city}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Users className="w-3 h-3" style={{ color: tc }} />
                            {community.member_count || 0}
                          </div>
                        </div>
                        {community.party_types?.length > 0 && (
                          <p className="text-[10px] mt-1 truncate" style={{ color: tc }}>
                            {community.party_types.slice(0, 3).join(' · ')}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    </div>
                  </motion.button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

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

function PlanRow({ plan, accent, onClick, past = false }) {
  let dateLabel = '';
  try { dateLabel = plan.date ? format(new Date(plan.date), 'EEE, MMM d') : ''; } catch (_) {}

  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
      style={{ background: past ? 'rgba(255,255,255,0.02)' : `${accent}0d`, border: `1px solid ${past ? 'rgba(255,255,255,0.05)' : accent + '30'}` }}>
      {plan.cover_image ? (
        <img src={plan.cover_image} className={`w-14 h-14 rounded-xl object-cover flex-shrink-0 ${past ? 'opacity-50 grayscale' : ''}`} />
      ) : (
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${past ? 'opacity-40' : ''}`}
          style={{ background: past ? '#1f2937' : `${accent}20` }}>🎉</div>
      )}
      <div className="min-w-0 flex-1">
        <p className={`font-bold truncate ${past ? 'text-gray-400' : 'text-white'}`}>{plan.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <MapPin className="w-3 h-3" /> {plan.city}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Calendar className="w-3 h-3" /> {dateLabel}
          </div>
        </div>
        {plan.status === 'happening' && (
          <span className="text-[10px] font-bold text-green-400 mt-0.5 flex items-center gap-1">
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
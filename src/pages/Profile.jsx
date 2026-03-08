import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, PartyPopper, Camera, ChevronRight, 
  Edit2, Loader2, Bell, MapPin, Clapperboard, Music2, Sparkles, Settings, ShieldCheck, Trophy, Plus, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '../components/common/BottomNav';
import VibeTag, { vibeConfig } from '../components/common/VibeTag';
import PartyTag, { partyTagConfig } from '../components/common/PartyTag';
import VerificationBadge from '../components/profile/VerificationBadge';
import VerificationFlow from '../components/profile/VerificationFlow';
import { useLanguage } from '../components/common/LanguageContext';
import { useProfileThemeContext } from '../components/common/ProfileThemeContext';
import { NATIONALITIES } from '../components/onboarding/NationalitySelect';
import { BACKGROUND_THEMES } from '../components/profile/BackgroundThemeSelector';
import ProfileStoryGrid from '../components/profile/ProfileStoryGrid';
import ProfilePlansCarousel from '../components/profile/ProfilePlansCarousel';
import ProfileAboutSection from '../components/profile/ProfileAboutSection';

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setProfileTheme } = useProfileThemeContext();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showVerification, setShowVerification] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        navigate(createPageUrl('Onboarding'));
      }
    };
    getUser();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['myProfile', currentUser?.id],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: currentUser.id }),
    select: (data) => data[0],
    enabled: !!currentUser?.id
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['myFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser.id, status: 'accepted' }),
    enabled: !!currentUser?.id
  });

  const { data: participations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: myStories = [] } = useQuery({
    queryKey: ['myStories', currentUser?.id],
    queryFn: () => base44.entities.ExperienceStory.filter({ user_id: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 100),
  });

  const myPlans = allPlans.filter(plan =>
    participations.some(p => p.plan_id === plan.id)
  );

  // Update theme context when profile loads
  useEffect(() => {
    if (profile?.profile_background_theme) {
      setProfileTheme(profile.profile_background_theme);
    }
  }, [profile?.profile_background_theme, setProfileTheme]);

  if (!currentUser || !profile) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
      </div>
    );
  }

  const photos = profile.photos?.filter(Boolean) || [];
  const hasPhotos = photos.length > 0;
  const selectedTheme = BACKGROUND_THEMES[profile.profile_background_theme] || BACKGROUND_THEMES.default;

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>

      {/* ── Hero Photo Gallery ── */}
      <div className="relative w-full h-[65vh] bg-gray-900 overflow-hidden" style={{ backgroundImage: `linear-gradient(135deg, ${selectedTheme.gradient})` }}>
        <AnimatePresence mode="wait">
          {hasPhotos ? (
            <motion.img
              key={currentPhotoIndex}
              src={photos[currentPhotoIndex]}
              alt=""
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#542b9b]/40 to-[#00fea3]/20">
              <Camera className="w-20 h-20 text-white/10" />
            </div>
          )}
        </AnimatePresence>

        {/* Gradient overlay with theme emoji pattern */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/20 to-transparent" />
        <div className="absolute inset-0 opacity-5 text-6xl overflow-hidden flex flex-wrap items-center justify-center gap-8 p-8 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
              {selectedTheme.emoji}
            </span>
          ))}
        </div>

        {/* Top action buttons */}
        <div className="absolute right-4 flex gap-2 z-10" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(createPageUrl('Notifications'))}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md relative"
          >
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(createPageUrl('EditProfile'))}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md"
          >
            <Edit2 className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(createPageUrl('Settings'))}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md"
          >
            <Settings className="w-5 h-5 text-gray-300" />
          </motion.button>
        </div>

        {/* Photo dots */}
        {photos.length > 1 && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPhotoIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentPhotoIndex ? 'w-5 h-1.5 bg-[#00fea3]' : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Tap zones */}
        {photos.length > 1 && (
          <>
            <button
              className="absolute left-0 top-20 bottom-0 w-1/3 z-20"
              onClick={() => setCurrentPhotoIndex(i => Math.max(0, i - 1))}
            />
            <button
              className="absolute right-0 top-20 bottom-0 w-1/3 z-20"
              onClick={() => setCurrentPhotoIndex(i => Math.min(photos.length - 1, i + 1))}
            />
          </>
        )}

        {/* Name + location pinned to bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-3xl font-bold text-white tracking-tight">{profile.display_name || currentUser.full_name}</h1>
            {profile.date_of_birth && (
              <span className="text-xl text-gray-300 font-semibold">
                {Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))}
              </span>
            )}
          </div>
          <div className="mt-1.5">
            <VerificationBadge isVerified={profile.is_verified} size="sm" />
          </div>
          {profile.city && (
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#00fea3]" />
              <span className="text-gray-300 text-sm">{profile.city}</span>
            </div>
          )}
          {profile.nationality && (() => {
            const nat = NATIONALITIES.find(n => n.code === profile.nationality);
            return nat ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-base">{nat.flag}</span>
                <span className="text-gray-300 text-sm">{nat.name}</span>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="px-5 pt-5">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Users, label: t.friends, value: friendships.length, color: 'text-[#00fea3]' },
            { icon: PartyPopper, label: t.parties, value: participations.length, color: 'text-[#542b9b]' },
            { icon: Clapperboard, label: t.stories, value: myStories.length, color: 'text-pink-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (label === t.friends) navigate(createPageUrl('Friends'));
                if (label === t.parties) navigate(createPageUrl('MyPlans'));
                if (label === t.stories) navigate(createPageUrl('MyStories'));
              }}
              className="bg-gray-900/60 border border-gray-800 rounded-2xl py-4 flex flex-col items-center gap-1 hover:border-gray-700 transition-colors"
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sticky top-0 z-30 bg-[#0b0b0b]/80 backdrop-blur-lg border-b border-gray-800 px-5">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {[
            { id: 'posts', label: '📸 Posts' },
            { id: 'planos', label: '🎉 Planos' },
            { id: 'sobre', label: 'ℹ️ Sobre' },
          ].map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                activeTab === tab.id ? 'text-[#00fea3]' : 'text-gray-400'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00fea3]"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="px-5 pt-5 space-y-7">
        <AnimatePresence mode="wait">
          {activeTab === 'posts' && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileStoryGrid
                stories={myStories}
                onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
              />
            </motion.div>
          )}

          {activeTab === 'planos' && (
            <motion.div
              key="planos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProfilePlansCarousel
                plans={myPlans}
                onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
              />
            </motion.div>
          )}

          {activeTab === 'sobre' && (
            <motion.div
              key="sobre"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileAboutSection profile={profile} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Items */}
        <div className="space-y-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(createPageUrl('Friends'))}
            className="w-full p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#00fea3]" />
              <span className="text-white font-medium">{t.myFriends}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(createPageUrl('MyPlans'))}
            className="w-full p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <PartyPopper className="w-5 h-5 text-[#542b9b]" />
              <span className="text-white font-medium">{t.joinedPartyPlans}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(createPageUrl('MyStories'))}
            className="w-full p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-[#00fea3]" />
              <span className="text-white font-medium">{t.myExperienceStories}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </motion.button>

          {/* Ambassador button — only if opted in */}
          {profile.ambassador_opted_in && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(createPageUrl('Ambassador'))}
              className={`w-full p-4 rounded-xl border flex items-center justify-between ${
                profile.is_ambassador
                  ? 'bg-purple-500/10 border-purple-500/40'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trophy className={`w-5 h-5 ${profile.is_ambassador ? 'text-purple-400' : 'text-gray-500'}`} />
                <div className="text-left">
                  <span className={`font-medium block ${profile.is_ambassador ? 'text-purple-400' : 'text-white'}`}>
                    {profile.is_ambassador ? '🏆 Vybt Ambassador' : 'Ambassador Program'}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {profile.is_ambassador ? 'All perks unlocked!' : `${profile.referred_count || 0}/10 friends invited`}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </motion.button>
          )}

          {/* Verification button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowVerification(true)}
            className={`w-full p-4 rounded-xl border flex items-center justify-between ${
              profile.is_verified
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-gray-900 border-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className={`w-5 h-5 ${profile.is_verified ? 'text-blue-400' : 'text-gray-500'}`} />
              <div className="text-left">
                <span className={`font-medium block ${profile.is_verified ? 'text-blue-400' : 'text-white'}`}>
                  {profile.is_verified ? t.profileVerified : t.verifyProfile}
                </span>
                {!profile.is_verified && (
                  <span className="text-gray-500 text-xs">{t.verifyBadge}</span>
                )}
              </div>
            </div>
            {!profile.is_verified && <ChevronRight className="w-5 h-5 text-gray-500" />}
          </motion.button>

        </div>
      </div>{/* end px-5 content */}

      <BottomNav />

      <VerificationFlow
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        userProfile={profile}
        onVerificationComplete={() => {
          setShowVerification(false);
        }}
      />
  </div>
  );
}
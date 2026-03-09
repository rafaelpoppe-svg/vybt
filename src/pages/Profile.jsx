import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Camera, Loader2, Bell, Settings, ShieldCheck, ShieldX,
  PartyPopper, Users, Edit2, Trophy, Music2, ChevronRight
} from 'lucide-react';
import BottomNav from '../components/common/BottomNav';
import VibeTag, { vibeConfig } from '../components/common/VibeTag';
import PartyTag from '../components/common/PartyTag';
import VerificationBadge from '../components/profile/VerificationBadge';
import VerificationFlow from '../components/profile/VerificationFlow';
import { useLanguage } from '../components/common/LanguageContext';
import { useProfileThemeContext } from '../components/common/ProfileThemeContext';
import { NATIONALITIES } from '../components/onboarding/NationalitySelect';
import ProfileStoryGrid from '../components/profile/ProfileStoryGrid';

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setProfileTheme } = useProfileThemeContext();
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [activeTab, setActiveTab] = useState('stories');

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

  // Fetch friend profiles for friends tab
  const friendIds = friendships.map(f => f.friend_id);
  const { data: friendProfiles = [] } = useQuery({
    queryKey: ['friendProfiles', friendIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        friendIds.map(id => base44.entities.UserProfile.filter({ user_id: id }))
      );
      return results.flat();
    },
    enabled: friendIds.length > 0
  });

  const myPlans = allPlans.filter(plan =>
    participations.some(p => p.plan_id === plan.id)
  );

  // Only show upcoming/happening plans (not ended, voting, terminated)
  const activePlans = myPlans.filter(plan =>
    ['upcoming', 'happening'].includes(plan.status)
  );

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
  const nationalityInfo = profile.nationality ? NATIONALITIES.find(n => n.code === profile.nationality) : null;
  const age = profile.date_of_birth
    ? Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const tabs = [
    { id: 'stories', icon: <Camera className="w-5 h-5" /> },
    { id: 'plans', icon: <PartyPopper className="w-5 h-5" /> },
    { id: 'friends', icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen overflow-y-auto overflow-x-hidden pb-24" style={{ WebkitOverflowScrolling: 'touch', background: getThemeBackground(profile?.profile_background_theme) }}>

      {/* ── Top Bar: Settings + Notifications ── */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        {/* Nationality tag */}
        <div className="flex items-center gap-1.5">
          {nationalityInfo && (
            <div className="flex items-center gap-1 bg-gray-800/70 rounded-full px-2.5 py-1">
              <span className="text-base leading-none">{nationalityInfo.flag}</span>
              <span className="text-xs text-gray-300 font-medium">{nationalityInfo.name}</span>
            </div>
          )}
        </div>

        {/* Action icons top right */}
        <div className="flex items-center gap-1">
          {/* Verify badge / verify button */}
          {profile.is_verified ? (
            <div className="flex items-center gap-1 bg-blue-500/20 rounded-full px-2.5 py-1 mr-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-blue-400 font-medium">Verified</span>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowVerification(true)}
              className="flex items-center gap-1 bg-gray-800/70 rounded-full px-2.5 py-1 mr-1"
            >
              <ShieldX className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">Verify</span>
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(createPageUrl('Notifications'))}
            className="p-2 hover:bg-gray-900 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(createPageUrl('Settings'))}
            className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-300" />
          </motion.button>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="px-4 pb-4">
        <div className="flex gap-4 items-start">
          {/* Profile Photo */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(createPageUrl('EditProfile'))}
            className="flex-shrink-0"
          >
            {hasPhotos ? (
              <img
                src={photos[0]}
                alt="profile"
                className="w-24 h-28 rounded-2xl object-cover border border-gray-700"
              />
            ) : (
              <div className="w-24 h-28 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-600" />
              </div>
            )}
          </motion.div>

          {/* Name + Stats */}
          <div className="flex-1 min-w-0 pt-1">
            {/* Name + age */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-white text-lg leading-tight">
                {profile.display_name || currentUser.full_name}
              </h2>
              {age && (
                <span className="text-sm font-semibold text-[#00fea3]">{age}y</span>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-5 mt-3">
              {[
                { value: myStories.length, label: 'stories' },
                { value: friendships.length, label: 'amigos' },
                { value: activePlans.length, label: 'plans' },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center">
                  <p className="text-lg font-bold text-white leading-tight">{value}</p>
                  <p className="text-xs text-gray-400 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-xs text-gray-300 mt-2 line-clamp-3">
                {profile.bio.split(' ').slice(0, 50).join(' ')}{profile.bio.split(' ').length > 50 ? '…' : ''}
              </p>
            )}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-2 mt-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(createPageUrl('EditProfile'))}
            className="flex-1 py-2.5 bg-[#7c3aed] rounded-xl text-white text-sm font-semibold"
          >
            {t.editProfile}
          </motion.button>
          {profile.ambassador_opted_in && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(createPageUrl('Ambassador'))}
              className="flex-1 py-2.5 bg-[#7c3aed] rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-4 h-4" />
              Ambassador
            </motion.button>
          )}
          {!profile.ambassador_opted_in && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(createPageUrl('Friends'))}
              className="flex-1 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              {t.friends}
            </motion.button>
          )}
        </div>

        {/* ── Vibes ── */}
        {profile.vibes && profile.vibes.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Music2 className="w-4 h-4 text-[#00fea3]" />
              <span className="text-sm font-semibold text-white">Vibes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.vibes.map(vibe => (
                <VibeTag key={vibe} vibe={vibe} size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="sticky top-0 z-30 bg-[#0b0b0b] border-b border-gray-800 flex">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#00fea3] text-[#00fea3]'
                : 'border-transparent text-gray-500'
            }`}
          >
            {tab.icon}
          </motion.button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'stories' && (
          <motion.div key="stories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfileStoryGrid
              stories={myStories}
              onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
            />
          </motion.div>
        )}

        {activeTab === 'plans' && (
          <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-3">
            {activePlans.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-10">{t.noPlansFound}</p>
            ) : (
              activePlans.map(plan => (
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
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                      plan.status === 'happening' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {plan.status === 'happening' ? '🟢 Happening' : '📅 Upcoming'}
                    </span>
                  </div>
                </motion.button>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'friends' && (
          <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-3">
            {friendships.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-10">{t.noFriendsYet}</p>
            ) : (
              friendProfiles.map(fp => (
                <motion.button
                  key={fp.user_id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(createPageUrl('UserProfile') + `?id=${fp.user_id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-900 rounded-xl border border-gray-800"
                >
                  {fp.photos?.[0] ? (
                    <img src={fp.photos[0]} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{fp.display_name || 'User'}</p>
                    {fp.city && <p className="text-xs text-gray-400">{fp.city}</p>}
                  </div>
                  {fp.is_verified && (
                    <ShieldCheck className="w-4 h-4 text-blue-400 ml-auto flex-shrink-0" />
                  )}
                </motion.button>
              ))
            )}
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
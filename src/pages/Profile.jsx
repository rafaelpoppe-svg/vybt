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

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden pb-24 bg-[#0b0b0b]" style={{ WebkitOverflowScrolling: 'touch' }}>

      {/* ── Header: Name, Stats, Actions ── */}
      <div className="sticky top-0 z-40 bg-[#0b0b0b] border-b border-gray-800 px-4 py-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="flex items-start justify-between gap-4">
          {/* Left: Profile pic small + Username + Bio preview */}
          <div className="flex gap-3 flex-1 min-w-0">
            <motion.div className="flex-shrink-0">
              {hasPhotos ? (
                <img
                  src={photos[0]}
                  alt="profile"
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-600" />
                </div>
              )}
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white truncate">{profile.display_name || currentUser.full_name}</h2>
                <VerificationBadge isVerified={profile.is_verified} size="xs" />
              </div>
              {profile.bio && (
                <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Right: Action icons */}
          <div className="flex gap-2 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(createPageUrl('Notifications'))}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors relative"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(createPageUrl('EditProfile'))}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
            >
              <Edit2 className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(createPageUrl('Settings'))}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex justify-between">
          {[
            { value: myStories.length, label: t.stories },
            { value: friendships.length, label: t.friends },
            { value: participations.length, label: t.parties },
          ].map(({ value, label }) => (
            <motion.div key={label} className="flex flex-col items-center">
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="px-4 py-3 flex gap-2 border-b border-gray-800">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(createPageUrl('EditProfile'))}
          className="flex-1 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm font-medium"
        >
          {t.editProfile}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <Users className="w-4 h-4" />
          {t.friends}
        </motion.button>
      </div>

      {/* ── Bio + Location ── */}
      <div className="px-4 py-3 border-b border-gray-800 space-y-2">
        {profile.bio && (
          <p className="text-sm text-gray-300">{profile.bio}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {profile.city && (
            <>
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.city}</span>
            </>
          )}
          {profile.nationality && (() => {
            const nat = NATIONALITIES.find(n => n.code === profile.nationality);
            return nat ? (
              <>
                <span className="text-base">{nat.flag}</span>
                <span>{nat.name}</span>
              </>
            ) : null;
          })()}
        </div>
      </div>

      {/* ── Stories Carousel (Like Instagram Stories) ── */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {/* Add Story Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(createPageUrl('AddStory'))}
            className="flex-shrink-0 w-16 h-20 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center hover:border-gray-600 transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-[10px] text-gray-400">Novo</span>
          </motion.button>

          {/* Story circles - show multiple photos as stories */}
          {photos.map((photo, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(createPageUrl('StoryView') + `?id=${photo}`)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5"
            >
              <div className="w-16 h-16 rounded-full border-2 border-[#00fea3] overflow-hidden bg-gray-800">
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-gray-400 text-center truncate w-16">{`Foto ${idx + 1}`}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sticky top-[calc(env(safe-area-inset-top,0px)+60px)] z-30 bg-[#0b0b0b] border-b border-gray-800 px-4 flex gap-6">
        {[
          { id: 'posts', label: '📸', icon: true },
          { id: 'planos', label: '🎬', icon: true },
          { id: 'sobre', label: '👤', icon: true },
        ].map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-1 border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-[#00fea3] text-white' : 'border-transparent text-gray-500'
            }`}
          >
            <span className="text-lg">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* ── Tab Content: Grid/Feed ── */}
      <div className="pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'posts' && (
            <motion.div
              key="posts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="space-y-3">
                {myPlans.map(plan => (
                  <motion.button
                    key={plan.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
                    className="w-full p-3 bg-gray-900 rounded-lg border border-gray-800 text-left hover:border-gray-700 transition-colors"
                  >
                    <p className="font-semibold text-white text-sm">{plan.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{plan.city} • {new Date(plan.date).toLocaleDateString()}</p>
                  </motion.button>
                ))}
                {myPlans.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-8">{t.noPlansFound}</p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'sobre' && (
            <motion.div
              key="sobre"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              <ProfileAboutSection profile={profile} />
              
              {/* Verification & Ambassador info */}
              <div className="space-y-2 mt-6">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowVerification(true)}
                  className={`w-full p-3 rounded-lg text-sm font-medium border flex items-center justify-between ${
                    profile.is_verified
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : 'bg-gray-900 border-gray-800 text-white'
                  }`}
                >
                  <span>{profile.is_verified ? '✓ ' + t.profileVerified : t.verifyProfile}</span>
                  {!profile.is_verified && <ChevronRight className="w-4 h-4" />}
                </motion.button>

                {profile.ambassador_opted_in && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(createPageUrl('Ambassador'))}
                    className={`w-full p-3 rounded-lg text-sm font-medium border flex items-center justify-between ${
                      profile.is_ambassador
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        : 'bg-gray-900 border-gray-800 text-white'
                    }`}
                  >
                    <span>{profile.is_ambassador ? '🏆 Ambassador' : t.ambassadorProgram}</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import BottomNav from '../components/common/BottomNav';
import HomeStoriesBar from '../components/home/HomeStoriesBar';
import HomeMapSection from '../components/home/HomeMapSection';
import HotPlansSection from '../components/home/HotPlansSection';
import LocationSelector from '../components/common/LocationSelector';
import HappeningNowBanner from '../components/feed/HappeningNowBanner';
import { useRecommendations } from '../components/recommendation/useRecommendations';
import PullToRefresh from '../components/common/PullToRefresh';
import useAutoDeleteTerminated from '../components/plan/useAutoDeleteTerminated';
import { usePushNotifications } from '../components/notifications/usePushNotifications';
import PlatformTutorial from '../components/onboarding/PlatformTutorial';
import { useLanguage } from '../components/common/LanguageContext';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [city, setCity] = useState(() => localStorage.getItem('selectedCity') || '');
  const [radius, setRadius] = useState(() => Number(localStorage.getItem('selectedRadius')) || 10);
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (!profiles || profiles.length === 0) {
          navigate(createPageUrl('Onboarding'));
        } else {
          setMyProfile(profiles[0]);
          if (!profiles[0].programs_shown) {
            navigate(createPageUrl('WelcomePrograms'));
            return;
          }
          if (!profiles[0].tutorial_completed) setShowTutorial(true);

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                try {
                  const { latitude, longitude } = position.coords;
                  const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                    { headers: { 'Accept-Language': 'en' } }
                  );
                  const data = await res.json();
                  const detectedCity =
                    data.address?.city || data.address?.town || data.address?.village || data.address?.county || null;
                  if (detectedCity) {
                    setCity(detectedCity);
                    localStorage.setItem('selectedCity', detectedCity);
                  }
                } catch (_) {}
              },
              () => {
                if (profiles[0].city && !localStorage.getItem('selectedCity')) {
                  setCity(profiles[0].city);
                  localStorage.setItem('selectedCity', profiles[0].city);
                  setRadius(profiles[0].radius_km || 10);
                  localStorage.setItem('selectedRadius', profiles[0].radius_km || 10);
                }
              },
              { timeout: 8000, maximumAge: 60000 }
            );
          } else if (profiles[0].city && !localStorage.getItem('selectedCity')) {
            setCity(profiles[0].city);
            localStorage.setItem('selectedCity', profiles[0].city);
          }
        }
      } catch (e) {}
    };
    checkOnboarding();
  }, []);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans', city],
    queryFn: () => base44.entities.PartyPlan.filter({ city }, '-created_date', 20),
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const all = await base44.entities.ExperienceStory.list('-created_date', 50);
      const now = new Date();
      return all.filter(s => {
        if (s.expires_at) return new Date(s.expires_at) > now;
        return (now - new Date(s.created_date)) < 24 * 3600 * 1000;
      });
    },
  });

  const { data: allParticipants = [] } = useQuery({
    queryKey: ['participants'],
    queryFn: () => base44.entities.PlanParticipant.list('-created_date', 100),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 50),
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['myFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id
  });

  const { data: reverseFriendships = [] } = useQuery({
    queryKey: ['reverseFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ friend_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id
  });

  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const profilesMap = userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});
  const friendIds = [...friendships.map(f => f.friend_id), ...reverseFriendships.map(f => f.user_id)];
  const pastPlanIds = myParticipations.map(p => p.plan_id);

  // Visible plans (filter terminated/ended for non-members)
  const visiblePlans = plans.filter(plan => {
    const isMember = myParticipations.some(p => p.plan_id === plan.id);
    if (plan.status === 'terminated' || plan.status === 'ended' || plan.status === 'voting') return isMember;
    return true;
  });

  const recommendedPlans = useRecommendations({
    plans: visiblePlans,
    userProfile: myProfile,
    friendIds,
    pastPlanIds,
    allParticipants,
    allPlans: visiblePlans
  });

  const myPlanIds = myParticipations.map(p => p.plan_id);
  const happeningPlan = visiblePlans.find(p => myPlanIds.includes(p.id) && p.status === 'happening') || null;

  // Stories filtered for display
  const visibleStories = stories.filter(s =>
    s.user_id === currentUser?.id || s.is_highlighted || friendIds.includes(s.user_id)
  );

  useAutoDeleteTerminated(plans);
  usePushNotifications({ currentUser, userCity: city, plans: visiblePlans, friendIds, myParticipations, userProfile: myProfile });

  const handleRefresh = async () => { await queryClient.invalidateQueries(); };

  const handleScroll = useCallback((e) => {
    const currentY = e.target.scrollTop;
    if (currentY > lastScrollY.current && currentY > 60) setHeaderVisible(false);
    else setHeaderVisible(true);
    lastScrollY.current = currentY;
  }, []);

  return (
    <div
      className="h-full bg-[#0b0b0b] overflow-y-auto overflow-x-hidden pb-24 scrollbar-hide"
      style={{ overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' }}
      onScroll={handleScroll}
    >
      {/* MAP SECTION — full width, large, with overlaid header + stories */}
      <div className="relative w-full" style={{ height: '62vh', minHeight: 380 }}>
        {/* Map fills the full area */}
        <HomeMapSection
          plans={visiblePlans}
          allParticipants={allParticipants}
          profilesMap={profilesMap}
          myParticipations={myParticipations}
          city={city}
          radius={radius}
          fullscreen
          onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
        />

        {/* Overlay: top bar (logo + location) */}
        <div
          className="absolute top-0 left-0 right-0 z-[600] flex items-center justify-between px-4"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 8 }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl" style={{ background: 'rgba(11,11,11,0.75)', backdropFilter: 'blur(12px)' }}>
            <img
              src="/icon.png"
              alt="Vybt"
              className="w-7 h-7 rounded-xl object-contain"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="text-2xl font-black bg-gradient-to-r from-[#00fea3] via-[#a855f7] to-[#f43f5e] bg-clip-text text-transparent">
              Vybt
            </h1>
          </div>
          <div style={{ background: 'rgba(11,11,11,0.75)', backdropFilter: 'blur(12px)', borderRadius: 16 }}>
            <LocationSelector
              city={city}
              radius={radius}
              onCityChange={(c) => { setCity(c); localStorage.setItem('selectedCity', c); }}
              onRadiusChange={(r) => { setRadius(r); localStorage.setItem('selectedRadius', r); }}
              adminMode={currentUser?.role === 'admin'}
            />
          </div>
        </div>

        {/* Overlay: Happening Now banner */}
        {happeningPlan && (
          <div className="absolute z-[600] left-0 right-0" style={{ top: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 52px)' }}>
            <HappeningNowBanner plan={happeningPlan} />
          </div>
        )}

        {/* Overlay: Stories bar at the bottom of the map */}
        <div className="absolute bottom-0 left-0 right-0 z-[600] pb-2 pt-2"
          style={{ background: 'linear-gradient(to top, rgba(11,11,11,0.7) 0%, transparent 100%)' }}>
          <HomeStoriesBar
            stories={visibleStories}
            userProfiles={profilesMap}
            currentUserId={currentUser?.id}
            happeningPlan={happeningPlan}
            onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
            onAddStory={() => navigate(createPageUrl('AddStory') + (happeningPlan ? `?planId=${happeningPlan.id}` : ''))}
          />
        </div>
      </div>

      {/* Main content below map */}
      <PullToRefresh onRefresh={handleRefresh}>
        <main className="space-y-6 py-4">

          {/* Hot Plans Tonight */}
          {plansLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-[#00fea3] animate-spin" />
            </div>
          ) : (
            <HotPlansSection
              plans={visiblePlans}
              allParticipants={allParticipants}
              onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
            />
          )}

          {/* My Joined Plans */}
          {myParticipations.length > 0 && (
            <section className="px-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-base">🎟️ {t.myPlans}</h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(createPageUrl('MyPlans'))}
                  className="text-sm font-medium"
                  style={{ color: '#a855f7' }}
                >
                  {t.seeAll}
                </motion.button>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {visiblePlans
                  .filter(p => myParticipations.some(mp => mp.plan_id === p.id))
                  .slice(0, 5)
                  .map((plan) => {
                    const isHot = plan.is_on_fire || plan.recent_joins >= 100;
                    const isHappening = plan.status === 'happening';
                    const accentColor = isHappening ? '#f97316' : isHot ? '#ef4444' : plan.is_highlighted ? '#a855f7' : '#00fea3';
                    return (
                      <motion.button
                        key={plan.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
                        className="flex-shrink-0 w-44 rounded-2xl overflow-hidden text-left"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${accentColor}44` }}
                      >
                        <div className="w-full h-24 relative overflow-hidden">
                          {plan.cover_image ? (
                            <img src={plan.cover_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl"
                              style={{ background: `linear-gradient(135deg, #1a1a2e, ${accentColor}66)` }}>🎉</div>
                          )}
                          {isHappening && (
                            <motion.div
                              animate={{ opacity: [1, 0.4, 1] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-bold"
                            >● LIVE</motion.div>
                          )}
                          {isHot && !isHappening && (
                            <div className="absolute top-2 left-2 text-sm">🔥</div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-white font-bold text-xs truncate">{plan.title}</p>
                          <p className="text-gray-500 text-[10px] truncate mt-0.5">{plan.city}</p>
                        </div>
                      </motion.button>
                    );
                  })}
              </div>
            </section>
          )}

          {/* Ambassador CTA when no plans */}
          {!plansLoading && visiblePlans.length === 0 && (
            <div className="px-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl p-5 text-center"
                style={{ background: 'linear-gradient(135deg, rgba(84,43,155,0.3), rgba(168,85,247,0.2))', border: '1px solid rgba(168,85,247,0.3)' }}
              >
                <p className="text-purple-300 font-semibold text-sm mb-1">🌍 {t.ambassadorCtaTitle}</p>
                <p className="text-gray-400 text-xs mb-3">
                  {t.ambassadorCtaDesc?.replace('{city}', city) || `No plans in ${city} yet. Become a Vybt Ambassador!`}
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(createPageUrl('Ambassador'))}
                  className="px-5 py-2 rounded-full font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #542b9b, #a855f7)' }}
                >
                  🏆 {t.becomeAmbassador}
                </motion.button>
              </motion.div>
            </div>
          )}

        </main>
      </PullToRefresh>

      <BottomNav />

      <AnimatePresence>
        {showTutorial && (
          <PlatformTutorial
            onClose={async () => {
              setShowTutorial(false);
              if (myProfile?.id) {
                await base44.entities.UserProfile.update(myProfile.id, { tutorial_completed: true });
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
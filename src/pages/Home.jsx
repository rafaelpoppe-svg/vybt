import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Loader2 } from 'lucide-react';
import StoriesBar from '../components/feed/StoriesBar';
import PlanCard from '../components/feed/PlanCard';
import LocationSelector from '../components/common/LocationSelector';
import BottomNav from '../components/common/BottomNav';
import ForYouSection from '../components/feed/ForYouSection';
import HappeningNowBanner from '../components/feed/HappeningNowBanner';
import { useRecommendations } from '../components/recommendation/useRecommendations';
import PullToRefresh from '../components/common/PullToRefresh';
import useAutoDeleteTerminated from '../components/plan/useAutoDeleteTerminated';
import { usePushNotifications } from '../components/notifications/usePushNotifications';
import PlatformTutorial from '../components/onboarding/PlatformTutorial';
import { AnimatePresence } from 'framer-motion';
import { useLanguage } from '../components/common/LanguageContext';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [city, setCity] = useState(() => localStorage.getItem('selectedCity') || '');
  const [radius, setRadius] = useState(() => Number(localStorage.getItem('selectedRadius')) || 10);
  const [storyFilter, setStoryFilter] = useState('All stories');
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = React.useRef(0);

  // Check onboarding and get user profile + auto-detect location
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

          // Show welcome programs page on first visit
          if (!profiles[0].programs_shown) {
            navigate(createPageUrl('WelcomePrograms'));
            return;
          }

          if (!profiles[0].tutorial_completed) {
            setShowTutorial(true);
          }
          // Auto-detect location via GPS (always runs on load)
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
                    data.address?.city ||
                    data.address?.town ||
                    data.address?.village ||
                    data.address?.county ||
                    null;
                  if (detectedCity) {
                    setCity(detectedCity);
                    localStorage.setItem('selectedCity', detectedCity);
                  }
                } catch (_) {}
              },
              () => {
                // Permission denied — fallback to profile city
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
            setRadius(profiles[0].radius_km || 10);
            localStorage.setItem('selectedRadius', profiles[0].radius_km || 10);
          }
        }
      } catch (e) {
        // Not logged in
      }
    };
    checkOnboarding();
  }, []);

  // Fetch plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans', city],
    queryFn: () => base44.entities.PartyPlan.filter({ city }, '-created_date', 20),
  });

  // Fetch stories — only non-expired (last 24h)
  const { data: stories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const all = await base44.entities.ExperienceStory.list('-created_date', 50);
      const now = new Date();
      return all.filter(s => {
        if (s.expires_at) return new Date(s.expires_at) > now;
        // fallback: created within 24h
        return (now - new Date(s.created_date)) < 24 * 3600 * 1000;
      });
    },
  });

  // Fetch participants for each plan
  const { data: allParticipants = [] } = useQuery({
    queryKey: ['participants'],
    queryFn: () => base44.entities.PlanParticipant.list('-created_date', 100),
  });

  // Fetch user profiles for stories
  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 50),
  });

  // Fetch friendships for recommendations
  const { data: friendships = [] } = useQuery({
    queryKey: ['myFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id
  });

  // Also fetch reverse friendships (where current user is the friend)
  const { data: reverseFriendships = [] } = useQuery({
    queryKey: ['reverseFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ friend_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id
  });

  // Fetch my participations for past attendance
  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const profilesMap = userProfiles.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  const friendIds = [
    ...friendships.map(f => f.friend_id),
    ...reverseFriendships.map(f => f.user_id)
  ];
  const pastPlanIds = myParticipations.map(p => p.plan_id);

  // Filter plans: hide ended/voting plans from non-members; hide terminated plans from everyone except members
  const visiblePlans = plans.filter(plan => {
    const isMember = myParticipations.some(p => p.plan_id === plan.id);

    // Terminated plans: only members can see them
    if (plan.status === 'terminated') return isMember;

    // Ended plans (awaiting admin decision or voting): only members can see them
    if (plan.status === 'ended' || plan.status === 'voting') return isMember;

    return true;
  });

  // Get personalized recommendations
  const recommendedPlans = useRecommendations({
    plans: visiblePlans,
    userProfile: myProfile,
    friendIds,
    pastPlanIds,
    allParticipants,
    allPlans: visiblePlans
  });

  const forYouPlans = recommendedPlans.filter(p => p.matchScore > 20).slice(0, 10);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayPlans = visiblePlans.filter(p => p.date === today);
  const upcomingPlans = visiblePlans.filter(p => p.date > today);

  // Detect a plan the user joined that is happening right now
  const myPlanIds = myParticipations.map(p => p.plan_id);
  const happeningPlan = visiblePlans.find(p =>
    myPlanIds.includes(p.id) && p.status === 'happening'
  ) || null;

  const getParticipants = (planId) => {
    return allParticipants
      .filter(p => p.plan_id === planId)
      .map(p => profilesMap[p.user_id])
      .filter(Boolean);
  };

  // Auto-delete terminated plans older than 24h
  useAutoDeleteTerminated(plans);

  // Smart push-style in-app notifications
  usePushNotifications({
    currentUser,
    userCity: city,
    plans: visiblePlans,
    friendIds,
    myParticipations,
    userProfile: myProfile,
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <div className="h-full bg-[#0b0b0b] overflow-y-auto overflow-x-hidden pb-24 scrollbar-hide" style={{ overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' }}>
      {/* Header — extends behind the iOS status bar */}
      <header className="sticky top-0 z-40 bg-[#0b0b0b] border-b border-gray-800/60">
        <div className="px-4 pb-4 flex items-center justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}>
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="Vybt" className="w-8 h-8 rounded-xl object-contain" onError={(e) => e.target.style.display='none'} />
            <h1 className="text-3xl font-black bg-gradient-to-r from-[#00fea3] to-[#542b9b] bg-clip-text text-transparent">
              Vybt
            </h1>
          </div>
          <LocationSelector
            city={city}
            radius={radius}
            onCityChange={(c) => { setCity(c); localStorage.setItem('selectedCity', c); }}
            onRadiusChange={(r) => { setRadius(r); localStorage.setItem('selectedRadius', r); }}
            adminMode={currentUser?.role === 'admin'}
          />
        </div>

        {/* Stories */}
        <div className="pb-4">
          {happeningPlan && <HappeningNowBanner plan={happeningPlan} />}
          <StoriesBar
            stories={stories.filter(s =>
              s.user_id === currentUser?.id ||
              s.is_highlighted ||
              friendIds.includes(s.user_id)
            )}
            userProfiles={profilesMap}
            currentFilter={storyFilter}
            onFilterChange={setStoryFilter}
            onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
            onAddStory={() => navigate(createPageUrl('AddStory') + (happeningPlan ? `?planId=${happeningPlan.id}` : ''))}
            currentUserId={currentUser?.id}
            happeningPlan={happeningPlan}
          />
        </div>
      </header>

      {/* Content — Pull to Refresh wraps the scrollable area */}
      <PullToRefresh onRefresh={handleRefresh}>
      <main className="px-4 py-6 space-y-8">
        {/* For You Section */}
        {forYouPlans.length > 0 && (
          <ForYouSection
            plans={forYouPlans}
            participants={allParticipants}
            profilesMap={profilesMap}
            onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
            onSeeAll={() => navigate(createPageUrl('Explore') + '?tab=foryou')}
          />
        )}

        {/* My Joined Plans Section */}
        {myParticipations.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                🎟️ {t.myPlans}
              </h2>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(createPageUrl('MyPlans'))}
                className="text-[#00fea3] text-sm font-medium"
              >
                {t.seeAll}
              </motion.button>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {visiblePlans
                .filter(p => myParticipations.some(mp => mp.plan_id === p.id))
                .slice(0, 5)
                .map((plan) => (
                  <div key={plan.id} className="min-w-[280px] max-w-[280px]">
                    <PlanCard
                      plan={plan}
                      participants={getParticipants(plan.id)}
                      onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
                    />
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Today Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[#00fea3]" />
            <h2 className="text-white font-bold text-lg">{t.tonight}</h2>
            <span className="text-gray-500 text-sm">{format(new Date(), 'EEE, MMM d')}</span>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#00fea3] animate-spin" />
            </div>
          ) : todayPlans.length > 0 ? (
            <div className="grid gap-4">
              {todayPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  participants={getParticipants(plan.id)}
                  onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
                  featured={plan.is_highlighted}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <p className="text-gray-500">No plans for tonight in {city}</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(createPageUrl('CreatePlan'))}
                className="mt-2 px-6 py-2 rounded-full bg-[#00fea3] text-[#0b0b0b] font-medium"
              >
                {t.createPlan}
              </motion.button>
              {/* Ambassador CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mx-auto max-w-sm mt-2 rounded-2xl bg-gradient-to-br from-[#542b9b]/30 to-purple-900/20 border border-purple-500/30 p-4 text-center"
              >
                <p className="text-purple-300 font-semibold text-sm mb-1">🌍 {t.ambassadorCtaTitle}</p>
                <p className="text-gray-400 text-xs mb-3">
                  {t.ambassadorCtaDesc?.replace('{city}', city) || `There are no plans in ${city} yet. Become a Vybt Ambassador and help bring the vibe to your area!`}
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => navigate(createPageUrl('Ambassador'))}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-[#542b9b] to-purple-500 text-white font-bold text-sm"
                >
                  🏆 {t.becomeAmbassador}
                </motion.button>
              </motion.div>
            </div>
          )}
        </section>

        {/* Upcoming Section */}
        {upcomingPlans.length > 0 && (
          <section>
            <h2 className="text-white font-bold text-lg mb-4">{t.upcomingPlans}</h2>
            <div className="grid gap-4">
              {upcomingPlans.slice(0, 5).map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  participants={getParticipants(plan.id)}
                  onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      </PullToRefresh>
      <BottomNav />

      {/* Platform Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <PlatformTutorial
            onClose={async () => {
              setShowTutorial(false);
              // Mark tutorial as completed in user profile
              if (myProfile?.id) {
                await base44.entities.UserProfile.update(myProfile.id, {
                  tutorial_completed: true
                });
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
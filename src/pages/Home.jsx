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

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [city, setCity] = useState(() => localStorage.getItem('selectedCity') || '');
  const [radius, setRadius] = useState(() => Number(localStorage.getItem('selectedRadius')) || 10);
  const [storyFilter, setStoryFilter] = useState('All stories');
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);

  // Check onboarding and get user profile
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
          // Only set from profile if user hasn't manually chosen a city yet
          if (profiles[0].city && !localStorage.getItem('selectedCity')) {
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

  // Fetch stories
  const { data: stories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: () => base44.entities.ExperienceStory.list('-created_date', 20),
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

  // Filter out voting plans for non-members
  const visiblePlans = plans.filter(plan => {
    if (plan.status === 'voting') {
      const isMember = myParticipations.some(p => p.plan_id === plan.id);
      return isMember;
    }
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
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-24" style={{ overscrollBehavior: 'none' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
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
                🎟️ My Plans
              </h2>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(createPageUrl('MyPlans'))}
                className="text-[#00fea3] text-sm font-medium"
              >
                See all
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
            <h2 className="text-white font-bold text-lg">Tonight</h2>
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
            <div className="text-center py-8">
              <p className="text-gray-500">No plans for tonight in {city}</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(createPageUrl('CreatePlan'))}
                className="mt-4 px-6 py-2 rounded-full bg-[#00fea3] text-[#0b0b0b] font-medium"
              >
                Create a plan
              </motion.button>
            </div>
          )}
        </section>

        {/* Upcoming Section */}
        {upcomingPlans.length > 0 && (
          <section>
            <h2 className="text-white font-bold text-lg mb-4">Upcoming Plans</h2>
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
    </div>
  );
}
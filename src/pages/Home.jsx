import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import BottomNav from '../components/common/BottomNav';
import HomeStoriesBar from '../components/home/HomeStoriesBar';
import LocationSelector from '../components/common/LocationSelector';
import HappeningNowBanner from '../components/feed/HappeningNowBanner';
import HomeLiveMap from '../components/home/HomeLiveMap';
import HomeMapControls from '../components/home/HomeMapControls';
import HomePlanFilterPanel from '../components/home/HomePlanFilterPanel';
import HomeHotPlansCarousel from '../components/home/HomeHotPlansCarousel';
import HomeLiveActivities from '../components/home/HomeLiveActivities';
import { useRecommendations } from '../components/recommendation/useRecommendations';
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
  const [activeSort, setActiveSort] = useState('foryou');
  const [showFilter, setShowFilter] = useState(false);
  const [mapFilters, setMapFilters] = useState({ partyTags: [], startTime: '', endTime: '' });


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
          if (!profiles[0].programs_shown) { navigate(createPageUrl('WelcomePrograms')); return; }
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
                  const detectedCity = data.address?.city || data.address?.town || data.address?.village || null;
                  if (detectedCity) { setCity(detectedCity); localStorage.setItem('selectedCity', detectedCity); }
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
    enabled: !!currentUser?.id,
  });

  const { data: reverseFriendships = [] } = useQuery({
    queryKey: ['reverseFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ friend_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id,
  });

  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id,
  });

  const profilesMap = useMemo(() =>
    userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {}),
    [userProfiles]
  );

  const friendIds = useMemo(() =>
    [...friendships.map(f => f.friend_id), ...reverseFriendships.map(f => f.user_id)],
    [friendships, reverseFriendships]
  );

  const pastPlanIds = myParticipations.map(p => p.plan_id);

  const visiblePlans = useMemo(() => plans.filter(plan => {
    const isMember = myParticipations.some(p => p.plan_id === plan.id);
    if (plan.status === 'terminated' || plan.status === 'ended' || plan.status === 'voting') return isMember;
    return true;
  }), [plans, myParticipations]);

  const recommendedPlans = useRecommendations({
    plans: visiblePlans,
    userProfile: myProfile,
    friendIds,
    pastPlanIds,
    allParticipants,
    allPlans: visiblePlans,
  });

  // Apply sort + filters to plans shown on map
  const filteredMapPlans = useMemo(() => {
    let result = [...visiblePlans];

    // Sort
    if (activeSort === 'foryou') {
      const recIds = recommendedPlans.map(r => r.id);
      result = [...result.filter(p => recIds.includes(p.id)), ...result.filter(p => !recIds.includes(p.id))];
    } else if (activeSort === 'hot') {
      result = result.filter(p => p.is_on_fire || p.recent_joins >= 100 || p.is_highlighted || p.status === 'happening');
    } else if (activeSort === 'members') {
      result = result.sort((a, b) => allParticipants.filter(p => p.plan_id === b.id).length - allParticipants.filter(p => p.plan_id === a.id).length);
    }

    // Tag filter
    if (mapFilters.partyTags?.length > 0) {
      result = result.filter(p => p.tags?.some(t => mapFilters.partyTags.includes(t)));
    }
    // Time filter
    if (mapFilters.startTime) result = result.filter(p => p.time >= mapFilters.startTime);
    if (mapFilters.endTime) result = result.filter(p => p.time <= mapFilters.endTime);

    return result;
  }, [visiblePlans, activeSort, mapFilters, recommendedPlans, allParticipants]);

  const myPlanIds = myParticipations.map(p => p.plan_id);
  const happeningPlan = visiblePlans.find(p => myPlanIds.includes(p.id) && p.status === 'happening') || null;

  const visibleStories = stories.filter(s =>
    s.user_id === currentUser?.id || s.is_highlighted || friendIds.includes(s.user_id)
  );

  useAutoDeleteTerminated(plans);
  usePushNotifications({ currentUser, userCity: city, plans: visiblePlans, friendIds, myParticipations, userProfile: myProfile });

  return (
    <div
      className="bg-[#0b0b0b] overflow-hidden"
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}
    >
      {/* Header fixo */}
      <header className="flex-shrink-0 bg-[#0b0b0b] z-40">
        <div
          className="px-4 pb-3 flex items-center justify-between"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}
        >
          <div className="flex items-center gap-2">
            <img
              src="/icon.png"
              alt="Vybt"
              className="w-8 h-8 rounded-xl object-contain"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="text-3xl font-black text-white">Vybt</h1>
          </div>
          <LocationSelector
            city={city}
            radius={radius}
            onCityChange={(c) => { setCity(c); localStorage.setItem('selectedCity', c); }}
            onRadiusChange={(r) => { setRadius(r); localStorage.setItem('selectedRadius', r); }}
            adminMode={currentUser?.role === 'admin'}
          />
        </div>

        {happeningPlan && <HappeningNowBanner plan={happeningPlan} />}

        <div className="pb-3 pt-1">
          <HomeStoriesBar
            stories={visibleStories}
            userProfiles={profilesMap}
            currentUserId={currentUser?.id}
            happeningPlan={happeningPlan}
            onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
            onAddStory={() => navigate(createPageUrl('AddStory') + (happeningPlan ? `?planId=${happeningPlan.id}` : ''))}
          />
        </div>
      </header>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 80px)' }}>
        {/* Map Controls: sort tabs + date/time + filter button */}
        <HomeMapControls
          activeSort={activeSort}
          setActiveSort={setActiveSort}
          onFilterClick={() => setShowFilter(v => !v)}
          hasActiveFilters={mapFilters.partyTags?.length > 0 || !!mapFilters.startTime || !!mapFilters.endTime}
        />

        {/* Filter panel */}
        <HomePlanFilterPanel
          isOpen={showFilter}
          onClose={() => setShowFilter(false)}
          filters={mapFilters}
          setFilters={setMapFilters}
        />

        {/* Mapa interativo */}
        <div className="px-4 mb-5">
          <HomeLiveMap
            plans={filteredMapPlans}
            allParticipants={allParticipants}
            city={city}
            onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
          />
        </div>

        {/* Hot Plans Carousel */}
        {plansLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 className="w-5 h-5 text-[#00fea3] animate-spin" />
          </div>
        ) : (
          <HomeHotPlansCarousel
            plans={visiblePlans}
            allParticipants={allParticipants}
            onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
          />
        )}

        {/* Live Activities */}
        <HomeLiveActivities
          friendIds={friendIds}
          allParticipants={allParticipants}
          stories={visibleStories}
          profilesMap={profilesMap}
          plans={visiblePlans}
          onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
          onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
        />
      </div>

      <BottomNav />

      <AnimatePresence>
        {showTutorial && (
          <PlatformTutorial
            onClose={async () => {
              setShowTutorial(false);
              if (myProfile?.id) await base44.entities.UserProfile.update(myProfile.id, { tutorial_completed: true });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
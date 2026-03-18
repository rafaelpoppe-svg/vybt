import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users, Bell } from 'lucide-react';
import StoryViewOverlay from '../components/story/StoryViewOverlay';

import BottomNav from '../components/common/BottomNav';
import HomeStoriesBar from '../components/home/HomeStoriesBar';
import LocationSelector from '../components/common/LocationSelector';
import HappeningNowBanner from '../components/feed/HappeningNowBanner';
import HomeLiveMap from '../components/home/HomeLiveMap';
import HomeMapControls from '../components/home/HomeMapControls';
import HomePlanFilterPanel from '../components/home/HomePlanFilterPanel';
import HomeLiveActivities from '../components/home/HomeLiveActivities';
import HomeHappeningNowSection from '../components/home/HomeHappeningNowSection';
import { useRecommendations } from '../components/recommendation/useRecommendations';
import useAutoDeleteTerminated from '../components/plan/useAutoDeleteTerminated';
import { usePushNotifications } from '../components/notifications/usePushNotifications';
import PlatformTutorial from '../components/onboarding/PlatformTutorial';
import { useLanguage } from '../components/common/LanguageContext';
import { useNotifications } from '../components/notifications/NotificationProvider';
import HomeCommunitiesBar from '../components/home/HomeCommunitiesBar';
import MyCommunitiesDrawer from '../components/home/MyCommunitiesDrawer';
import HomeBottomFeed from '../components/home/HomeBottomFeed';


export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  const [city, setCity] = useState(() => localStorage.getItem('selectedCity') || '');
  const [radius, setRadius] = useState(() => Number(localStorage.getItem('selectedRadius')) || 10);
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeSort, setActiveSort] = useState('foryou');
  const [overlayStoryId, setOverlayStoryId] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showMyCommunities, setShowMyCommunities] = useState(false);
  const [mapFilters, setMapFilters] = useState({ partyTags: [], startTime: '', endTime: '', planDate: '' });


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

  const { data: pois = [] } = useQuery({
    queryKey: ['pois', city],
    queryFn: () => city ? base44.entities.PointOfInterest.filter({ city }) : base44.entities.PointOfInterest.list(),
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans', city],
    queryFn: () => base44.entities.PartyPlan.filter({ city }, '-created_date', 100),
  });

  
  console.log("plans:", plans);

  const { data: stories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const all = await base44.entities.ExperienceStory.list('-created_date');
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

  const { data: communities = [] } = useQuery({
    queryKey: ['communities', city],
    queryFn: () => city ? base44.entities.Community.filter({ city }) : base44.entities.Community.list('-created_date', 20),
  });

  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id,
  });

  const { data: myCommunityMemberships = [] } = useQuery({
    queryKey: ['myCommunityMemberships', currentUser?.id],
    queryFn: () => base44.entities.CommunityMember.filter({ user_id: currentUser?.id }),
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
    if (plan.status === 'terminated' || plan.status === 'ended' || plan.status === 'voting' || plan.status === "renewed") return isMember;
    // Client-side: if happening but past end time, hide from non-members (backend may not have updated yet)
    if (plan.status === 'happening' && plan.date) {
      const endDateTime = plan.end_time
        ? new Date(`${plan.date}T${plan.end_time}:00`)
        : new Date(new Date(`${plan.date}T${plan.time || '23:59'}:00`).getTime() + 8 * 60 * 60 * 1000);
      if (new Date() > endDateTime) return isMember;
    }
    return true;
  }), [plans, myParticipations]);
  //console.log('3.5. visible plans:', visiblePlans);

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
    } else if (activeSort === 'myplans') {
      const myIds = myParticipations.map(p => p.plan_id);
      result = result.filter(p => myIds.includes(p.id));
    }

    // Tag filter
    if (mapFilters.partyTags?.length > 0) {
      result = result.filter(p => p.tags?.some(t => mapFilters.partyTags.includes(t)));
    }
    // Time filter
    if (mapFilters.startTime) result = result.filter(p => p.time >= mapFilters.startTime);
    if (mapFilters.endTime) result = result.filter(p => p.time <= mapFilters.endTime);
    // Date filter
    if (mapFilters.planDate) result = result.filter(p => p.date === mapFilters.planDate);

    return result;
  }, [visiblePlans, activeSort, mapFilters, recommendedPlans, allParticipants]);

  const myPlanIds = myParticipations.map(p => p.plan_id);
  const happeningPlan = visiblePlans.find(p => {
    if (!myPlanIds.includes(p.id) || p.status !== 'happening') return false;
    // Check end_time client-side
    if (p.date) {
      const endDateTime = p.end_time
        ? new Date(`${p.date}T${p.end_time}:00`)
        : new Date(new Date(`${p.date}T${p.time || '23:59'}:00`).getTime() + 8 * 60 * 60 * 1000);
      if (new Date() > endDateTime) return false;
    }
    return true;
  }) || null;

  // Stories visíveis: próprios + amigos + stories de planos da cidade REMOVER SE DER CERTO
  /*const visibleStories = stories.filter(s => {
    if (s.user_id === currentUser?.id) return true;
    if (s.is_highlighted) return true;
    if (friendIds.includes(s.user_id)) return true;
    // Stories de planos na cidade/raio
    return visiblePlans.some(p => p.id === s.plan_id);
  });*/
  //console.log('0. currentUser:', currentUser);
  console.log('0. myProfile:', {
    ...myProfile,
    myPlans: myParticipations.map(p => {
      const plan = plans.find(pl => pl.id === p.plan_id);
      return { plan_id: p.plan_id, title: plan?.title, status: plan?.status };
    })
  });
  console.log('1. stories:', stories.map(s => ({ ...s, display_name: profilesMap[s.user_id]?.display_name })));

  const ownStories = useMemo(() => 
    stories
      .filter(s => s.user_id === currentUser?.id)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
  , [stories, currentUser?.id]);
  console.log('2. ownStories:', ownStories);

  const friendStories = useMemo(() => 
    stories.filter(s => friendIds.includes(s.user_id))
  , [stories, friendIds]);
  console.log('3. friendStories:', friendStories.map(s => ({ ...s, display_name: profilesMap[s.user_id]?.display_name })));

  console.log('3.5. visible plans:', visiblePlans);
  const planStories = useMemo(() => 
    stories.filter(s => !!s.plan_id && visiblePlans.some(p => p.id === s.plan_id))
  , [stories, visiblePlans]);
  console.log('4. planStories:', planStories);

  useAutoDeleteTerminated(plans);
  usePushNotifications({ currentUser, userCity: city, plans: visiblePlans, friendIds, myParticipations, userProfile: myProfile });

  // City background map (only famous/capital cities)
  const CITY_BACKGROUNDS = {
    'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=60',
    'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=60',
    'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=60',
    'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=60',
    'Miami': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800&q=60',
    'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=60',
    'Ibiza': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=60',
    'Berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=60',
    'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=60',
    'Lisbon': 'https://images.unsplash.com/photo-1588493782072-76da4b7dc25e?w=800&q=60',
    'Lisboa': 'https://images.unsplash.com/photo-1588493782072-76da4b7dc25e?w=800&q=60',
    'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=60',
    'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=60',
    'Los Angeles': 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=60',
    'São Paulo': 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?w=800&q=60',
    'Rio de Janeiro': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=60',
  };

  const cityBg = city ? Object.entries(CITY_BACKGROUNDS).find(([k]) =>
    city.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(city.toLowerCase())
  )?.[1] : null;

  return (
    <div
      className="bg-[#0b0b0b] overflow-hidden"
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}
    >
      {/* City background overlay */}
      {cityBg && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `url(${cityBg})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.18,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Header fixo */}
      <header className="flex-shrink-0 bg-[#0b0b0b] z-40" style={{ position: 'relative', zIndex: 40 }}>
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
          <div className="flex items-center gap-2">

            <LocationSelector
              city={city}
              radius={radius}
              onCityChange={(c) => { setCity(c); localStorage.setItem('selectedCity', c); }}
              onRadiusChange={(r) => { setRadius(r); localStorage.setItem('selectedRadius', r); }}
              adminMode={currentUser?.role === 'admin'}
            />
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => navigate(createPageUrl('Notifications'))}
              className="relative p-2 rounded-full bg-white/5 border border-white/10"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#00c6d2] text-[#0b0b0b] text-[10px] font-black px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {happeningPlan && <HappeningNowBanner plan={happeningPlan} />}

        <div className="pb-3 pt-1">
          <HomeStoriesBar
            /* REMOVER stories={visibleStories}*/
            ownStories={ownStories}
            friendStories={friendStories}
            planStories={planStories}
            userProfiles={profilesMap}
            plans={visiblePlans}
            currentUserId={currentUser?.id}
            happeningPlan={happeningPlan}
            onStoryClick={(story) => setOverlayStoryId(story.id)}
            onPlanStoriesClick={(plan, planStories) => {
              const firstStory = planStories.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
              if (firstStory) setOverlayStoryId(firstStory.id);
            }}
            onAddStory={() => navigate(createPageUrl('AddStory') + (happeningPlan ? `?planId=${happeningPlan.id}` : ''))}
          />
        </div>
      </header>

      {/* Conteúdo scrollável */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{
          position: 'relative',
          zIndex: 1,
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 80px)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Map Controls: sort tabs + date/time + filter button */}
        <HomeMapControls
          activeSort={activeSort}
          setActiveSort={setActiveSort}
          onFilterClick={() => setShowFilter(v => !v)}
          hasActiveFilters={mapFilters.partyTags?.length > 0 || !!mapFilters.startTime || !!mapFilters.endTime || !!mapFilters.planDate}
        />

        {/* Filter panel */}
        <HomePlanFilterPanel
          isOpen={showFilter}
          onClose={() => setShowFilter(false)}
          filters={mapFilters}
          setFilters={setMapFilters}
        />

        {/* Plans For You */}
        <HomeCommunitiesBar plans={plans} />

        {/* Mapa interativo */}
        <div className="px-4 mb-5">
          <HomeLiveMap
            plans={filteredMapPlans}
            allParticipants={allParticipants}
            city={city}
            pois={pois}
            onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
          />
        </div>

        {/* Happening Now */}
        <HomeHappeningNowSection
          plans={visiblePlans}
          allParticipants={allParticipants}
          onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
        />

        {/* Bottom Feed: For You / My Space */}
        <HomeBottomFeed
          plans={visiblePlans}
          allParticipants={allParticipants}
          communities={communities}
          memberCommunityIds={myCommunityMemberships.map(m => m.community_id)}
          myParticipations={myParticipations}
          recommendedPlans={recommendedPlans}
          friendIds={friendIds}
          communityMembers={myCommunityMemberships}
          onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
        />

        {/* Live Activities */}
        <HomeLiveActivities
          friendIds={friendIds}
          allParticipants={allParticipants}
          /* REMOVER stories={visibleStories}*/
          friendStories={friendStories}
          profilesMap={profilesMap}
          plans={visiblePlans}
          onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
          onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
        />
      </div>

      <BottomNav />

      <StoryViewOverlay storyId={overlayStoryId} onClose={() => setOverlayStoryId(null)} />

      <MyCommunitiesDrawer
        isOpen={showMyCommunities}
        onClose={() => setShowMyCommunities(false)}
        communities={communities}
        memberCommunityIds={myCommunityMemberships.map(m => m.community_id)}
      />

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
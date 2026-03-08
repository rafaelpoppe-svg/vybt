import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

import BottomNav from '../components/common/BottomNav';
import HomeStoriesBar from '../components/home/HomeStoriesBar';
import HotPlansSection from '../components/home/HotPlansSection';
import LocationSelector from '../components/common/LocationSelector';
import HappeningNowBanner from '../components/feed/HappeningNowBanner';
import { useRecommendations } from '../components/recommendation/useRecommendations';
import useAutoDeleteTerminated from '../components/plan/useAutoDeleteTerminated';
import { usePushNotifications } from '../components/notifications/usePushNotifications';
import PlatformTutorial from '../components/onboarding/PlatformTutorial';
import { useLanguage } from '../components/common/LanguageContext';

function parseTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function filterByTime(plans, timeFilter) {
  if (timeFilter === 'all') return plans;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return plans.filter(plan => {
    const start = parseTime(plan.time);
    const end = parseTime(plan.end_time);
    if (timeFilter === 'now') {
      if (plan.status === 'happening') return true;
      if (start === null) return false;
      if (end !== null) return nowMins >= start && nowMins <= end;
      return Math.abs(nowMins - start) <= 60;
    }
    if (timeFilter === 'tonight') {
      if (start === null) return true;
      return start >= 18 * 60;
    }
    if (timeFilter === 'late') {
      if (start === null) return false;
      return start >= 23 * 60 || start <= 5 * 60;
    }
    return true;
  });
}

function filterByType(plans, typeFilter) {
  if (!typeFilter || typeFilter === 'All') return plans;
  return plans.filter(p => p.tags?.some(tag => tag.toLowerCase().includes(typeFilter.toLowerCase())));
}

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [city, setCity] = useState(() => localStorage.getItem('selectedCity') || '');
  const [radius, setRadius] = useState(() => Number(localStorage.getItem('selectedRadius')) || 10);
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [filters, setFilters] = useState({ time: 'all', type: 'All' });

  const now = new Date();
  const dateLabel = format(now, "EEEE, d MMM");
  const timeLabel = format(now, "HH:mm");

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

  const filteredPlans = useMemo(() => {
    let result = filterByTime(visiblePlans, filters.time);
    result = filterByType(result, filters.type);
    return result;
  }, [visiblePlans, filters]);

  const recommendedPlans = useRecommendations({
    plans: filteredPlans,
    userProfile: myProfile,
    friendIds,
    pastPlanIds,
    allParticipants,
    allPlans: visiblePlans,
  });

  const myPlanIds = myParticipations.map(p => p.plan_id);
  const happeningPlan = visiblePlans.find(p => myPlanIds.includes(p.id) && p.status === 'happening') || null;

  const visibleStories = stories.filter(s =>
    s.user_id === currentUser?.id || s.is_highlighted || friendIds.includes(s.user_id)
  );

  useAutoDeleteTerminated(plans);
  usePushNotifications({ currentUser, userCity: city, plans: visiblePlans, friendIds, myParticipations, userProfile: myProfile });

  return (
    <div
      className="bg-[#0b0b0b] overflow-y-auto overflow-x-hidden scrollbar-hide"
      style={{
        minHeight: '100dvh',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 80px)',
      }}
    >
      {/* Header */}
      <header style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}>
        <div className="px-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="Vybt" className="w-8 h-8 rounded-xl object-contain" onError={e => e.target.style.display='none'} />
            <div>
              <h1 className="text-2xl font-black text-white leading-tight">Vybt</h1>
              <p className="text-gray-500 text-[10px] leading-none">{dateLabel} · {timeLabel}</p>
            </div>
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
      </header>

      {/* Experiences Stories */}
      <section className="mt-2 mb-4">
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="text-white font-bold text-sm">🌙 Experiences Tonight</h2>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </div>
        <HomeStoriesBar
          stories={visibleStories}
          userProfiles={profilesMap}
          currentUserId={currentUser?.id}
          happeningPlan={happeningPlan}
          onStoryClick={(story) => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
          onAddStory={() => navigate(createPageUrl('AddStory') + (happeningPlan ? `?planId=${happeningPlan.id}` : ''))}
        />
      </section>

      {/* Live Map */}
      <section className="mb-4">
        <HomeLiveMap
          plans={visiblePlans}
          allParticipants={allParticipants}
          city={city}
          onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
          onExpand={() => navigate(createPageUrl('Explore'))}
        />
      </section>

      {/* Filters */}
      <section className="mb-4">
        <HomeFilterBar onFilterChange={setFilters} />
      </section>

      {/* Hot Plans Tonight */}
      <section className="mb-4">
        {plansLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-[#00fea3] animate-spin" />
          </div>
        ) : (
          <HotPlansSection
            plans={filteredPlans}
            allParticipants={allParticipants}
            onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
          />
        )}
      </section>

      {/* For You */}
      <section className="mb-6">
        <HomeForYouSection
          plans={recommendedPlans.length > 0 ? recommendedPlans.map(r => r.plan || r) : filteredPlans}
          allParticipants={allParticipants}
          onPlanClick={(plan) => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
        />
      </section>

      {/* Empty state */}
      {!plansLoading && filteredPlans.length === 0 && (
        <div className="px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 text-center"
            style={{ background: 'linear-gradient(135deg,rgba(84,43,155,0.3),rgba(168,85,247,0.2))', border: '1px solid rgba(168,85,247,0.3)' }}
          >
            <p className="text-purple-300 font-semibold text-sm mb-1">🌍 No plans found</p>
            <p className="text-gray-400 text-xs mb-3">
              {filters.time !== 'all' || filters.type !== 'All'
                ? 'Try changing your filters'
                : `No plans in ${city} yet. Become a Vybt Ambassador!`}
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(createPageUrl('Ambassador'))}
              className="px-5 py-2 rounded-full font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg,#542b9b,#a855f7)' }}
            >🏆 {t.becomeAmbassador || 'Become Ambassador'}</motion.button>
          </motion.div>
        </div>
      )}

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
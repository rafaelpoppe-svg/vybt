import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PullToRefresh from '../components/common/PullToRefresh';
import { Search, Flame, Users, Loader2, Filter, Map, LayoutGrid, User, Check, X, UserPlus } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import PlanCard from '../components/feed/PlanCard';
import BottomNav from '../components/common/BottomNav';
import { useRecommendations } from '../components/recommendation/useRecommendations';
import { PlanFilters, UserFilters } from '../components/explore/ExploreFilters';
import PartyTag, { ALL_PARTY_TYPES } from '../components/common/PartyTag';
import PlanMap from '../components/explore/PlanMap';
import { useLanguage } from '../components/common/LanguageContext';

export default function Explore() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab');
  
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [activeView, setActiveView] = useState('plans'); // 'plans', 'users', or 'map'
  const [userSubTab, setUserSubTab] = useState('discover'); // 'discover' or 'requests'
  const [showFilters, setShowFilters] = useState(false);
  const [planFilters, setPlanFilters] = useState({ sortBy: initialTab === 'foryou' ? 'foryou' : 'onfire' });
  const [userFilters, setUserFilters] = useState({ sortBy: 'foryou' });
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('selectedCity') || '');

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles?.[0]) setMyProfile(profiles[0]);
      } catch (e) {}
    };
    getUser();
  }, []);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 50),
  });

  const { data: allParticipants = [] } = useQuery({
    queryKey: ['allParticipants'],
    queryFn: () => base44.entities.PlanParticipant.list('-created_date', 200),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['myFriendshipsExplore', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id
  });

  const { data: receivedFriendRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ['receivedFriendRequestsExplore', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ friend_id: currentUser?.id, status: 'pending' }),
    enabled: !!currentUser?.id
  });

  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipationsExplore', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const profilesMap = userProfiles.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  const friendIds = friendships.map(f => f.friend_id);
  const pastPlanIds = myParticipations.map(p => p.plan_id);

  // Get personalized recommendations
  const recommendedPlans = useRecommendations({
    plans,
    userProfile: myProfile,
    friendIds,
    pastPlanIds,
    allParticipants,
    allPlans: plans
  });

  const getParticipantCount = (planId) => {
    return allParticipants.filter(p => p.plan_id === planId).length;
  };

  const getParticipants = (planId) => {
    return allParticipants
      .filter(p => p.plan_id === planId)
      .map(p => profilesMap[p.user_id])
      .filter(Boolean);
  };

  // Use recommended plans for "For You" sort, otherwise use regular plans
  const basePlans = planFilters.sortBy === 'foryou' ? recommendedPlans : plans;

  let filteredPlans = basePlans.filter(plan => {
    const isMember = myParticipations.some(p => p.plan_id === plan.id);

    // Hide terminated, ended, and voting plans from non-members
    if (plan.status === 'terminated' || plan.status === 'ended' || plan.status === 'voting') {
      if (!isMember) return false;
    }

    // Filter by current city
    if (selectedCity && plan.city?.toLowerCase() !== selectedCity.toLowerCase()) return false;
    
    const matchesSearch = plan.title.toLowerCase().includes(search.toLowerCase()) ||
      plan.location_address?.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag === 'All' || plan.tags?.some(t => 
      t.toLowerCase().includes(selectedTag.toLowerCase())
    );
    
    // Apply additional filters
    let matchesFilters = true;
    if (planFilters.vibes?.length > 0) {
      matchesFilters = plan.tags?.some(t => planFilters.vibes.includes(t));
    }
    if (planFilters.partyTags?.length > 0) {
      matchesFilters = matchesFilters && plan.tags?.some(t => planFilters.partyTags.includes(t));
    }
    
    return matchesSearch && matchesTag && matchesFilters;
  });

  // Sort plans - Highlighted plans always first, then apply other sorting
  filteredPlans = filteredPlans.sort((a, b) => {
    // Highlighted (paid) plans always come first
    if (a.is_highlighted && !b.is_highlighted) return -1;
    if (!a.is_highlighted && b.is_highlighted) return 1;
    
    // Then apply specific sort
    if (planFilters.sortBy === 'onfire') {
      // OnFire plans (100+ joins in 2 hours) next
      const aOnFire = a.is_on_fire || (a.recent_joins >= 100);
      const bOnFire = b.is_on_fire || (b.recent_joins >= 100);
      if (aOnFire && !bOnFire) return -1;
      if (!aOnFire && bOnFire) return 1;
      return (b.view_count || 0) - (a.view_count || 0);
    } else if (planFilters.sortBy === 'popular') {
      return getParticipantCount(b.id) - getParticipantCount(a.id);
    } else if (planFilters.sortBy === 'foryou') {
      return (b.matchScore || 0) - (a.matchScore || 0);
    }
    return 0;
  });

  // Filter users
  let filteredUsers = userProfiles.filter(profile => {
    if (profile.user_id === currentUser?.id) return false;

    // Filter by current city
    if (selectedCity && profile.city?.toLowerCase() !== selectedCity.toLowerCase()) return false;
    
    const matchesSearch = profile.display_name?.toLowerCase().includes(search.toLowerCase());
    
    let matchesFilters = true;
    if (userFilters.gender) {
      matchesFilters = profile.gender === userFilters.gender;
    }
    if (userFilters.vibes?.length > 0) {
      matchesFilters = matchesFilters && profile.vibes?.some(v => userFilters.vibes.includes(v));
    }
    
    return matchesSearch && matchesFilters;
  });

  // Sort users by matching vibes
  if (userFilters.sortBy === 'foryou' && myProfile?.vibes) {
    filteredUsers = filteredUsers.sort((a, b) => {
      const aMatches = a.vibes?.filter(v => myProfile.vibes.includes(v)).length || 0;
      const bMatches = b.vibes?.filter(v => myProfile.vibes.includes(v)).length || 0;
      return bMatches - aMatches;
    });
  }

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  const acceptMutation = useMutation({
    mutationFn: (friendshipId) => base44.entities.Friendship.update(friendshipId, { status: 'accepted' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['receivedFriendRequestsExplore', currentUser?.id]);
      queryClient.invalidateQueries(['myFriendshipsExplore', currentUser?.id]);
    }
  });

  const declineMutation = useMutation({
    mutationFn: (friendshipId) => base44.entities.Friendship.update(friendshipId, { status: 'declined' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['receivedFriendRequestsExplore', currentUser?.id]);
    }
  });

  return (
    <div className="flex flex-col bg-[#0b0b0b]" style={{ height: '100dvh', overscrollBehavior: 'none' }}>
      {/* Header */}
      <header className="flex-shrink-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 p-4">
        <h1 className="text-xl font-bold text-white mb-4">{t.explore}</h1>
        
        {/* View Toggle */}
        <div className="flex gap-2 mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveView('plans')}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 ${
              activeView === 'plans'
                ? 'bg-[#00fea3] text-[#0b0b0b]'
                : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            {t.plans}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveView('map')}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 ${
              activeView === 'map'
                ? 'bg-[#00fea3] text-[#0b0b0b]'
                : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            <Map className="w-4 h-4" />
            {t.map}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveView('users')}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 ${
              activeView === 'users'
                ? 'bg-[#00fea3] text-[#0b0b0b]'
                : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            <User className="w-4 h-4" />
            {t.people}
          </motion.button>
        </div>
        
        {/* Search */}
        <div className="relative mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeView === 'plans' ? t.searchPlans : activeView === 'map' ? t.searchPlans : t.searchPeople}
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
          {activeView !== 'map' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl ${showFilters ? 'bg-[#00fea3] text-[#0b0b0b]' : 'bg-gray-900 text-gray-400'}`}
            >
              <Filter className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Filters Panel */}
        <div className="relative">
          {activeView === 'plans' ? (
            <PlanFilters 
              isOpen={showFilters} 
              onClose={() => setShowFilters(false)}
              filters={planFilters}
              setFilters={setPlanFilters}
            />
          ) : (
            <UserFilters
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
              filters={userFilters}
              setFilters={setUserFilters}
            />
          )}
        </div>

        {/* Tags - Only for plans/map */}
        {(activeView === 'plans' || activeView === 'map') && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTag('All')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                selectedTag === 'All'
                  ? 'bg-[#00fea3] text-[#0b0b0b]'
                  : 'bg-gray-900 text-gray-400 border border-gray-800'
              }`}
            >
              {t.allTag}
            </motion.button>
            {ALL_PARTY_TYPES.map((tag) => (
              <div key={tag} className="flex-shrink-0">
                <PartyTag
                  tag={tag}
                  size="md"
                  interactive
                  selected={selectedTag === tag}
                  onClick={() => setSelectedTag(tag)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Sort buttons */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {activeView === 'plans' ? (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPlanFilters({ ...planFilters, sortBy: 'foryou' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  planFilters.sortBy === 'foryou' ? 'bg-gradient-to-r from-[#00fea3]/30 to-[#542b9b]/30 text-[#00fea3]' : 'bg-gray-900 text-gray-400'
                }`}
              >
                ❤️ {t.forYou}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPlanFilters({ ...planFilters, sortBy: 'onfire' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  planFilters.sortBy === 'onfire' ? 'bg-orange-500/30 text-orange-400' : 'bg-gray-900 text-gray-400'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                {t.onFire}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPlanFilters({ ...planFilters, sortBy: 'popular' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  planFilters.sortBy === 'popular' ? 'bg-[#542b9b]/30 text-[#00fea3]' : 'bg-gray-900 text-gray-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                {t.mostMembers}
              </motion.button>
            </>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setUserFilters({ ...userFilters, sortBy: 'foryou' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                userFilters.sortBy === 'foryou' ? 'bg-gradient-to-r from-[#00fea3]/30 to-[#542b9b]/30 text-[#00fea3]' : 'bg-gray-900 text-gray-400'
              }`}
            >
              ❤️ {t.matchesVibes || 'Matches My Vibes'}
            </motion.button>
          )}
        </div>
      </header>

      {/* Map View — fills remaining space between header and bottom nav */}
      {activeView === 'map' && (
        <div className="flex-1 overflow-hidden">
          <PlanMap
            plans={filteredPlans}
            allParticipants={allParticipants}
            profilesMap={profilesMap}
            myParticipations={myParticipations}
            selectedCity={selectedCity}
            onCityChange={(c) => setSelectedCity(c)}
          />
        </div>
      )}

      {/* Content — scrollable area */}
      {activeView !== 'map' && (
        <div className="flex-1 overflow-y-auto">
          <PullToRefresh onRefresh={handleRefresh}>
            <main className="p-4 pb-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
                </div>
              ) : activeView === 'plans' ? (
                filteredPlans.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredPlans.map((plan) => {
                      const isOnFire = plan.is_on_fire || (plan.recent_joins >= 100);
                      return (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          participants={getParticipants(plan.id)}
                          featured={plan.is_highlighted}
                          matchScore={planFilters.sortBy === 'foryou' ? plan.matchScore : null}
                          matchReasons={planFilters.sortBy === 'foryou' ? plan.matchReasons : null}
                          isOnFire={isOnFire}
                          onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">{t.noPlansFound}</p>
                  </div>
                )
              ) : (
                filteredUsers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredUsers.map((profile) => {
                      const matchingVibes = myProfile?.vibes?.filter(v => profile.vibes?.includes(v)) || [];
                      return (
                        <motion.button
                          key={profile.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(createPageUrl('UserProfile') + `?id=${profile.user_id}`)}
                          className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800"
                        >
                          <div className="aspect-square relative">
                            {profile.photos?.[0] ? (
                              <img src={profile.photos[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00fea3]/30 flex items-center justify-center">
                                <span className="text-4xl text-white font-bold">
                                  {profile.display_name?.[0] || '?'}
                                </span>
                              </div>
                            )}
                            {matchingVibes.length > 0 && (
                              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-[#00fea3]/80 text-[#0b0b0b] text-[10px] font-bold">
                                {matchingVibes.length} {t.vibesMatch}
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-white font-medium truncate">{profile.display_name || 'User'}</p>
                            {profile.city && (
                              <p className="text-gray-500 text-xs mt-0.5">{profile.city}</p>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">{t.noUsersFound}</p>
                  </div>
                )
              )}
            </main>
          </PullToRefresh>
        </div>
      )}

      <div className="flex-shrink-0">
        <BottomNav />
      </div>
    </div>
  );
}
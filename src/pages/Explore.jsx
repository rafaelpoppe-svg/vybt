import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PullToRefresh from '../components/common/PullToRefresh';
import { Search, Flame, Users, Loader2, Filter, LayoutGrid, User, Check, X, UserPlus } from 'lucide-react';
import UserCard from '../components/explore/UserCard';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import PlanCard from '../components/feed/PlanCard';
import BottomNav from '../components/common/BottomNav';
import { useRecommendations } from '../components/recommendation/useRecommendations';
import { PlanFilters, UserFilters } from '../components/explore/ExploreFilters';
import PartyTag, { ALL_PARTY_TYPES } from '../components/common/PartyTag';
import { useLanguage } from '../components/common/LanguageContext';
import CommunityCard from '../components/community/CommunityCard';

export default function Explore() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab');
  
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [activeView, setActiveView] = useState(initialTab === 'communities' ? 'communities' : 'plans'); // 'plans', 'users', 'communities'
  const [userSubTab, setUserSubTab] = useState('discover'); // 'discover' or 'requests'
  const [showFilters, setShowFilters] = useState(false);
  const [planFilters, setPlanFilters] = useState({ sortBy: initialTab === 'foryou' ? 'foryou' : 'onfire' });
  const [userFilters, setUserFilters] = useState({ sortBy: 'foryou' });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: myProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['myProfile', currentUser?.id],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: currentUser?.id }).then(r => r[0] || null),
    enabled: !!currentUser?.id,
  });

  const { data: communities = [], isLoading: loadingCommunities } = useQuery({
    queryKey: ['allCommunities'],
    queryFn: () => base44.entities.Community.list('-created_date', 50),
  });

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

  const { data: sentFriendRequests = [] } = useQuery({
    queryKey: ['sentFriendRequests', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id }),
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

  // Don't show anything until we know the user's city
  const userCity = myProfile?.city?.toLowerCase();

  let filteredPlans = basePlans.filter(plan => {
    // Hide voting and terminated plans from everyone in Explore
    if (plan.status === 'voting' || plan.status === 'terminated') return false;

    // Client-side: hide plans whose time has passed (ended or in voting window)
    if (plan.date && plan.time) {
      const start = new Date(`${plan.date}T${plan.time}:00`);
      const end = plan.end_time
        ? new Date(`${plan.date}T${plan.end_time}:00`)
        : new Date(start.getTime() + 8 * 60 * 60 * 1000);
      if (new Date() > end) return false;
    }

    // Hide plans that admin chose to hide from Explore
    if (plan.show_in_explore === false) return false;

    // Filter by current user's city — always enforce
    if (!userCity) return false;
    if (plan.city?.toLowerCase() !== userCity) return false;
    
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

    // Filter by current user's city — always enforce
    if (!userCity) return false;
    if (profile.city?.toLowerCase() !== userCity) return false;
    
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
      <header className="flex-shrink-0 z-40 backdrop-blur-lg border-b border-gray-800/60 px-4 pt-3 pb-0" style={{ background: 'linear-gradient(180deg, #0b0b0b 60%, rgba(11,11,11,0.92) 100%)' }}>
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.6 }}
              className="text-xl"
            >🔍</motion.span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{t.explore}</h1>
            {activeView === 'plans' && filteredPlans.length > 0 && (
              <motion.span
                key={filteredPlans.length}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[10px] font-bold text-[#0b0b0b] bg-[#00c6d2] px-2 py-0.5 rounded-full"
              >
                {filteredPlans.length}
              </motion.span>
            )}
          </div>
          {/* Filter button — only for plans and users, not communities */}
          {activeView !== 'map' && activeView !== 'communities' && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`relative p-2.5 rounded-xl transition-all ${showFilters ? 'bg-[#00c6d2] text-[#0b0b0b]' : 'bg-gray-900 text-gray-400 border border-gray-800'}`}
            >
              <Filter className="w-4 h-4" />
              {showFilters && (
                <motion.span
                  layoutId="filter-dot"
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500"
                />
              )}
            </motion.button>
          )}
        </div>

        {/* View Toggle — pill style */}
        <div className="relative flex bg-gray-900 rounded-2xl p-1 mb-3">
          <motion.div
            className="absolute top-1 bottom-1 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #00c6d2, #542b9b)' }}
            animate={{
              left: activeView === 'plans' ? '4px' : activeView === 'communities' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 2px)',
              width: 'calc(33.33% - 6px)'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          <button onClick={() => setActiveView('plans')}
            className={`relative flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${activeView === 'plans' ? 'text-[#0b0b0b]' : 'text-gray-400'}`}>
            <LayoutGrid className="w-3 h-3" />{t.plans}
          </button>
          <button onClick={() => setActiveView('communities')}
            className={`relative flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${activeView === 'communities' ? 'text-[#0b0b0b]' : 'text-gray-400'}`}>
            ⭐ Groups
          </button>
          <button onClick={() => setActiveView('users')}
            className={`relative flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${activeView === 'users' ? 'text-[#0b0b0b]' : 'text-gray-400'}`}>
            <User className="w-3 h-3" />{t.people}
            {receivedFriendRequests.length > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{receivedFriendRequests.length}</span>}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeView === 'plans' ? t.searchPlans : t.searchPeople}
            className="pl-9 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 rounded-xl h-10"
          />
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
            >✕</motion.button>
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

        {/* Tags + Sort — scrollable row, only for plans */}
        {activeView === 'plans' && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3" data-hscroll="1">
            {/* Sort pills */}
            {[
              { key: 'foryou', label: t.forYou, emoji: '❤️', activeClass: 'bg-gradient-to-r from-[#00c6d2]/30 to-[#542b9b]/30 text-[#00c6d2] border-[#00c6d2]/30' },
              { key: 'onfire', label: t.onFire, emoji: '🔥', activeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
              { key: 'popular', label: t.mostMembers, emoji: '👥', activeClass: 'bg-[#542b9b]/30 text-purple-300 border-[#542b9b]/30' },
            ].map(({ key, label, emoji, activeClass }) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.92 }}
                onClick={() => setPlanFilters({ ...planFilters, sortBy: key })}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                  planFilters.sortBy === key ? activeClass : 'bg-gray-900 text-gray-400 border-gray-800'
                }`}
              >
                <span>{emoji}</span> {label}
              </motion.button>
            ))}

            <div className="w-px h-5 bg-gray-800 self-center mx-1 flex-shrink-0" />

            {/* Tag filter */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setSelectedTag('All')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border flex-shrink-0 transition-all ${
                selectedTag === 'All' ? 'bg-[#00c6d2] text-[#0b0b0b] border-[#00c6d2]' : 'bg-gray-900 text-gray-400 border-gray-800'
              }`}
            >
              {t.allTag}
            </motion.button>
            {ALL_PARTY_TYPES.map((tag) => (
              <div key={tag} className="flex-shrink-0">
                <PartyTag tag={tag} size="md" interactive selected={selectedTag === tag} onClick={() => setSelectedTag(tag)} />
              </div>
            ))}
          </div>
        )}

        {/* Users sub-tabs */}
        {activeView === 'users' && (
          <div className="flex gap-2 pb-3">
            {[
              { key: 'discover', label: t.matchesVibes || 'Matches My Vibes', emoji: '❤️' },
              { key: 'requests', label: 'Requests', emoji: '👋', badge: receivedFriendRequests.length },
            ].map(({ key, label, emoji, badge }) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.93 }}
                onClick={() => setUserSubTab(key)}
                className={`relative flex-1 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  userSubTab === key
                    ? 'bg-gradient-to-r from-[#00c6d2]/25 to-[#542b9b]/25 text-[#00c6d2] border border-[#00c6d2]/30'
                    : 'bg-gray-900 text-gray-400 border border-gray-800'
                }`}
              >
                <span>{emoji}</span> {label}
                {badge > 0 && (
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold"
                  >{badge}</motion.span>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </header>

      {/* Content — scrollable area */}
      <div className="flex-1 overflow-y-auto">
          <PullToRefresh onRefresh={handleRefresh}>
            <main className="p-4 pb-4 space-y-5">
              {activeView === 'communities' ? (
                loadingCommunities ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" /></div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-gray-400 text-sm">{communities.filter(c => !c.is_deleted && !c.is_private && userCity && c.city?.toLowerCase() === userCity).length} communities</p>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(createPageUrl('CreateCommunity'))}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-[#0b0b0b] flex items-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg, #00c6d2, #542b9b)' }}>
                        + Create
                      </motion.button>
                    </div>
                    {communities.filter(c => !c.is_deleted && !c.deletion_scheduled_at && !c.is_private && userCity && c.city?.toLowerCase() === userCity).length === 0
                      ? <div className="text-center py-16 space-y-3"><div className="text-5xl">⭐</div><p className="text-gray-500 text-sm">No communities here yet</p><p className="text-gray-600 text-xs">Be the first to create one! 🚀</p></div>
                      : <div className="grid grid-cols-2 gap-3">
                          {communities.filter(c => !c.is_deleted && !c.deletion_scheduled_at && !c.is_private && userCity && c.city?.toLowerCase() === userCity)
                            .map((community, i) => (
                              <motion.div key={community.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <CommunityCard community={community} myProfile={myProfile}
                                  onClick={() => navigate(createPageUrl('CommunityView') + `?id=${community.id}`)} />
                              </motion.div>
                            ))}
                        </div>}
                  </div>
                )
              ) : (isLoadingProfile && !!currentUser) || isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
                </div>
              ) : activeView === 'plans' ? (
                filteredPlans.length > 0 ? (
                  <>
                    {/* On Fire banner */}
                    {filteredPlans.some(p => p.is_on_fire || p.recent_joins >= 100) && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-3 flex items-center gap-3 overflow-hidden relative"
                        style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(249,115,22,0.1))', border: '1px solid rgba(239,68,68,0.3)' }}
                      >
                        <motion.span
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="text-2xl flex-shrink-0"
                        >🔥</motion.span>
                        <div>
                          <p className="text-red-400 font-bold text-sm">On Fire Plans 🌶️</p>
                          <p className="text-red-300/70 text-xs">These are blowing up right now!</p>
                        </div>
                        <motion.div
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute right-4 text-3xl pointer-events-none"
                        >🎸</motion.div>
                      </motion.div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredPlans.map((plan, idx) => {
                        const isOnFire = plan.is_on_fire || (plan.recent_joins >= 100);
                        return (
                          <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
                          >
                            <PlanCard
                              plan={plan}
                              participants={getParticipants(plan.id)}
                              featured={plan.is_highlighted}
                              matchScore={planFilters.sortBy === 'foryou' ? plan.matchScore : null}
                              matchReasons={planFilters.sortBy === 'foryou' ? plan.matchReasons : null}
                              isOnFire={isOnFire}
                              onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
                              currentUserId={currentUser?.id}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 space-y-3">
                    <div className="text-5xl">🎭</div>
                    <p className="text-gray-500 text-sm">{t.noPlansFound}</p>
                    <p className="text-gray-600 text-xs">Try changing filters or city 🌍</p>
                  </div>
                )
              ) : userSubTab === 'requests' ? (
                receivedFriendRequests.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {receivedFriendRequests.map((request) => {
                      const requester = profilesMap[request.user_id];
                      if (!requester) return null;
                      return (
                        <UserCard
                          key={request.id}
                          profile={requester}
                          myProfile={myProfile}
                          currentUser={currentUser}
                          isFriend={false}
                          isPendingSent={false}
                          mode="request"
                          friendshipId={request.id}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3">
                    <div className="text-5xl">👥</div>
                    <p className="text-gray-500 text-sm">No pending friend requests</p>
                  </div>
                )
              ) : (
                filteredUsers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredUsers.map((profile) => {
                      const isFriend = friendIds.includes(profile.user_id);
                      const isPendingSent = sentFriendRequests.some(
                        r => r.friend_id === profile.user_id && r.status === 'pending'
                      );
                      return (
                        <UserCard
                          key={profile.id}
                          profile={profile}
                          myProfile={myProfile}
                          currentUser={currentUser}
                          isFriend={isFriend}
                          isPendingSent={isPendingSent}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3">
                    <div className="text-5xl">🕺</div>
                    <p className="text-gray-500 text-sm">{t.noUsersFound}</p>
                    <p className="text-gray-600 text-xs">No one found with those filters 🎭</p>
                  </div>
                )
              )}
            </main>
          </PullToRefresh>
        </div>

      <div className="flex-shrink-0">
        <BottomNav />
      </div>
    </div>
  );
}
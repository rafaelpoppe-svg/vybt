import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, TrendingUp, Users, Loader2, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PlanCard from '../components/feed/PlanCard';
import BottomNav from '../components/common/BottomNav';
import { useRecommendations } from '../components/recommendation/useRecommendations';

const partyTags = [
  'All', 'Rooftop', 'Techno', 'Bar', 'Luxury', 'House Party', 'University', 'Commercial'
];

export default function Explore() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab');
  
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [sortBy, setSortBy] = useState(initialTab === 'foryou' ? 'foryou' : 'highlighted');
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);

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
  const basePlans = sortBy === 'foryou' ? recommendedPlans : plans;

  let filteredPlans = basePlans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(search.toLowerCase()) ||
      plan.location_address?.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag === 'All' || plan.tags?.some(t => 
      t.toLowerCase().includes(selectedTag.toLowerCase())
    );
    return matchesSearch && matchesTag;
  });

  // Sort plans (For You is already sorted by score)
  if (sortBy === 'highlighted') {
    filteredPlans = filteredPlans.sort((a, b) => {
      if (a.is_highlighted && !b.is_highlighted) return -1;
      if (!a.is_highlighted && b.is_highlighted) return 1;
      return (b.view_count || 0) - (a.view_count || 0);
    });
  } else if (sortBy === 'popular') {
    filteredPlans = filteredPlans.sort((a, b) => 
      getParticipantCount(b.id) - getParticipantCount(a.id)
    );
  } else if (sortBy === 'views') {
    filteredPlans = filteredPlans.sort((a, b) => 
      (b.view_count || 0) - (a.view_count || 0)
    );
  }
  // sortBy === 'foryou' keeps the recommendation order

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 p-4">
        <h1 className="text-xl font-bold text-white mb-4">Explore Plans</h1>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans..."
            className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Tags */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {partyTags.map((tag) => (
            <motion.button
              key={tag}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedTag === tag
                  ? 'bg-[#00fea3] text-[#0b0b0b]'
                  : 'bg-gray-900 text-gray-400 border border-gray-800'
              }`}
            >
              {tag}
            </motion.button>
          ))}
        </div>

        {/* Sort buttons */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSortBy('foryou')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              sortBy === 'foryou' ? 'bg-gradient-to-r from-[#00fea3]/30 to-[#542b9b]/30 text-[#00fea3]' : 'bg-gray-900 text-gray-400'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            For You
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSortBy('highlighted')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              sortBy === 'highlighted' ? 'bg-[#542b9b]/30 text-[#00fea3]' : 'bg-gray-900 text-gray-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Featured
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSortBy('popular')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              sortBy === 'popular' ? 'bg-[#542b9b]/30 text-[#00fea3]' : 'bg-gray-900 text-gray-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Most Members
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSortBy('views')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              sortBy === 'views' ? 'bg-[#542b9b]/30 text-[#00fea3]' : 'bg-gray-900 text-gray-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Top Views
          </motion.button>
        </div>
      </header>

      {/* Plans Grid */}
      <main className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
          </div>
        ) : filteredPlans.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                participants={getParticipants(plan.id)}
                featured={sortBy === 'foryou' ? plan.matchScore > 50 : plan.is_highlighted}
                matchScore={sortBy === 'foryou' ? plan.matchScore : null}
                matchReasons={sortBy === 'foryou' ? plan.matchReasons : null}
                onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No plans found</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
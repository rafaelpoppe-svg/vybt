import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Loader2 } from 'lucide-react';
import PlanCard from '../components/feed/PlanCard';

export default function MyPlans() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {}
    };
    getUser();
  }, []);

  const { data: participations = [], isLoading: participationsLoading } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 100),
  });

  const { data: allParticipants = [] } = useQuery({
    queryKey: ['allParticipants'],
    queryFn: () => base44.entities.PlanParticipant.list('-created_date', 500),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 200),
  });

  const profilesMap = userProfiles.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  const myPlanIds = participations.map(p => p.plan_id);
  const myPlans = plans.filter(p => myPlanIds.includes(p.id));

  const getParticipants = (planId) => {
    return allParticipants
      .filter(p => p.plan_id === planId)
      .map(p => profilesMap[p.user_id])
      .filter(Boolean);
  };

  const isLoading = participationsLoading || plansLoading;

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 p-4 flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-900"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        <h1 className="text-xl font-bold text-white">Joined Party Plans</h1>
      </header>

      <main className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
          </div>
        ) : myPlans.length > 0 ? (
          <div className="grid gap-4">
            {myPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                participants={getParticipants(plan.id)}
                onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't joined any plans yet</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(createPageUrl('Explore'))}
              className="px-6 py-2 rounded-full bg-[#00fea3] text-[#0b0b0b] font-medium"
            >
              Explore Plans
            </motion.button>
          </div>
        )}
      </main>
    </div>
  );
}
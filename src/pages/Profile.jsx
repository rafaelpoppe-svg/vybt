import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Settings, Users, PartyPopper, Camera, ChevronRight, 
  LogOut, Edit2, Loader2, Bell, ChevronLeft as ChevronLeftIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '../components/common/BottomNav';
import VibeTag from '../components/common/VibeTag';
import PartyTag from '../components/common/PartyTag';

export default function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        navigate(createPageUrl('Onboarding'));
      }
    };
    getUser();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['myProfile', currentUser?.id],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: currentUser.id }),
    select: (data) => data[0],
    enabled: !!currentUser?.id
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['myFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser.id, status: 'accepted' }),
    enabled: !!currentUser?.id
  });

  const { data: participations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: myStories = [] } = useQuery({
    queryKey: ['myStories', currentUser?.id],
    queryFn: () => base44.entities.ExperienceStory.filter({ user_id: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!currentUser || !profile) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-24">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Profile</h1>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(createPageUrl('Notifications'))}
            className="p-2 rounded-full bg-gray-900 relative"
          >
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(createPageUrl('EditProfile'))}
            className="p-2 rounded-full bg-gray-900"
          >
            <Edit2 className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className="p-2 rounded-full bg-gray-900"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
          </motion.button>
        </div>
      </header>

      <main className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          {/* Full-screen Photo Carousel */}
          <div className="relative w-full h-[70vh] mb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhotoIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                {profile.photos?.[currentPhotoIndex] ? (
                  <img 
                    src={profile.photos[currentPhotoIndex]} 
                    alt="" 
                    className="w-full h-full object-cover rounded-3xl"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-3xl border-2 border-dashed border-gray-700">
                    <Camera className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {profile.photos?.filter(Boolean).length > 1 && (
              <>
                {currentPhotoIndex > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentPhotoIndex(currentPhotoIndex - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 backdrop-blur-sm"
                  >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                  </motion.button>
                )}
                {currentPhotoIndex < profile.photos.filter(Boolean).length - 1 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentPhotoIndex(currentPhotoIndex + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 backdrop-blur-sm"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </motion.button>
                )}
              </>
            )}

            {/* Photo Indicators */}
            {profile.photos?.filter(Boolean).length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {profile.photos.filter(Boolean).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhotoIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === currentPhotoIndex 
                        ? 'w-8 bg-[#00fea3]' 
                        : 'w-2 bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="px-4 w-full">
            <h2 className="text-2xl font-bold text-white">{profile.display_name || currentUser.full_name}</h2>
            <p className="text-gray-500">{profile.city || 'No location set'}</p>
          
            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-400 text-sm mt-2 max-w-xs">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-8 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{friendships.length}</p>
                <p className="text-xs text-gray-500">Friends</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{participations.length}</p>
                <p className="text-xs text-gray-500">Parties</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{myStories.length}</p>
                <p className="text-xs text-gray-500">Stories</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-6">
          {/* Vibes */}
          {profile.vibes?.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">My Vibes</h3>
              <div className="flex flex-wrap gap-2">
                {profile.vibes.map((vibe, i) => (
                  <VibeTag key={i} vibe={vibe} size="md" />
                ))}
              </div>
            </div>
          )}

          {/* Party Types */}
          {profile.party_types?.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">Preferred Parties</h3>
              <div className="flex flex-wrap gap-2">
                {profile.party_types.map((type, i) => (
                  <PartyTag key={i} tag={type} size="md" />
                ))}
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="space-y-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(createPageUrl('Friends'))}
            className="w-full p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#00fea3]" />
              <span className="text-white font-medium">My Friends</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(createPageUrl('MyPlans'))}
            className="w-full p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <PartyPopper className="w-5 h-5 text-[#542b9b]" />
              <span className="text-white font-medium">Joined Party Plans</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(createPageUrl('MyStories'))}
            className="w-full p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-[#00fea3]" />
              <span className="text-white font-medium">My Experience Stories</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </motion.button>
        </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
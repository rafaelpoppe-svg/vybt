import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, PartyPopper, Camera, ChevronRight, 
  LogOut, Edit2, Loader2, Bell, MapPin, Clapperboard, Music2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '../components/common/BottomNav';
import VibeTag, { vibeConfig } from '../components/common/VibeTag';
import PartyTag, { partyTagConfig } from '../components/common/PartyTag';

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

  const photos = profile.photos?.filter(Boolean) || [];
  const hasPhotos = photos.length > 0;

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-24">

      {/* ── Hero Photo Gallery ── */}
      <div className="relative w-full h-[65vh] bg-gray-900 overflow-hidden">
        <AnimatePresence mode="wait">
          {hasPhotos ? (
            <motion.img
              key={currentPhotoIndex}
              src={photos[currentPhotoIndex]}
              alt=""
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#542b9b]/40 to-[#00fea3]/20">
              <Camera className="w-20 h-20 text-white/10" />
            </div>
          )}
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/20 to-transparent" />

        {/* Top action buttons */}
        <div className="absolute top-12 right-4 flex gap-2 z-10">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(createPageUrl('Notifications'))}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md relative"
          >
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(createPageUrl('EditProfile'))}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md"
          >
            <Edit2 className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md"
          >
            <LogOut className="w-5 h-5 text-gray-300" />
          </motion.button>
        </div>

        {/* Photo dots */}
        {photos.length > 1 && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPhotoIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentPhotoIndex ? 'w-5 h-1.5 bg-[#00fea3]' : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Tap zones */}
        {photos.length > 1 && (
          <>
            <button
              className="absolute left-0 top-20 bottom-0 w-1/3 z-20"
              onClick={() => setCurrentPhotoIndex(i => Math.max(0, i - 1))}
            />
            <button
              className="absolute right-0 top-20 bottom-0 w-1/3 z-20"
              onClick={() => setCurrentPhotoIndex(i => Math.min(photos.length - 1, i + 1))}
            />
          </>
        )}

        {/* Name + location pinned to bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">{profile.display_name || currentUser.full_name}</h1>
            {profile.date_of_birth && (
              <span className="text-xl text-gray-300 font-semibold">
                {Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))}
              </span>
            )}
          </div>
          {profile.city && (
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#00fea3]" />
              <span className="text-gray-300 text-sm">{profile.city}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-5 pt-5 space-y-7">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Friends', value: friendships.length, color: 'text-[#00fea3]' },
            { icon: PartyPopper, label: 'Parties', value: participations.length, color: 'text-[#542b9b]' },
            { icon: Clapperboard, label: 'Stories', value: myStories.length, color: 'text-pink-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-gray-900/60 border border-gray-800 rounded-2xl py-4 flex flex-col items-center gap-1">
              <Icon className={`w-5 h-5 ${color}`} />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl px-4 py-4">
            <p className="text-gray-300 text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* My Vibes */}
        {profile.vibes?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Music2 className="w-4 h-4 text-[#00fea3]" />
              <h3 className="text-white font-semibold text-sm uppercase tracking-widest">My Vibes</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.vibes.map((vibe, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <VibeTag vibe={vibe} size="lg" selected />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Preferred Parties */}
        {profile.party_types?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#542b9b]" />
              <h3 className="text-white font-semibold text-sm uppercase tracking-widest">Preferred Parties</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.party_types.map((type, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <PartyTag tag={type} size="md" selected />
                </motion.div>
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

      <BottomNav />
    </div>
  );
}
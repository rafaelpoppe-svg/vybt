import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, UserPlus, MessageCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VibeTag from '../components/common/VibeTag';
import PartyTag from '../components/common/PartyTag';

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  
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

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: userId }),
    select: (data) => data[0],
    enabled: !!userId
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendshipStatus', currentUser?.id, userId],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, friend_id: userId }),
    enabled: !!currentUser?.id && !!userId
  });

  const { data: userFriendships = [] } = useQuery({
    queryKey: ['userFriendships', userId],
    queryFn: () => base44.entities.Friendship.filter({ user_id: userId, status: 'accepted' }),
    enabled: !!userId
  });

  const { data: participations = [] } = useQuery({
    queryKey: ['userParticipations', userId],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: userId }),
    enabled: !!userId
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['userStories', userId],
    queryFn: () => base44.entities.ExperienceStory.filter({ user_id: userId }),
    enabled: !!userId
  });

  const existingFriendship = friendships[0];
  const isFriend = existingFriendship?.status === 'accepted';
  const isPending = existingFriendship?.status === 'pending';

  const addFriendMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Friendship.create({
        user_id: currentUser.id,
        friend_id: userId,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friendshipStatus', currentUser?.id, userId]);
    }
  });

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-24">
      {/* Header */}
      <header className="p-4 flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-900"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        <h1 className="text-xl font-bold text-white">{profile.display_name}'s Profile</h1>
      </header>

      <main className="px-4 space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          {/* Photos */}
          <div className="flex gap-2 mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${i === 0 ? 'w-24 h-24' : 'w-16 h-16'} rounded-2xl overflow-hidden bg-gray-800`}
              >
                {profile.photos?.[i] ? (
                  <img 
                    src={profile.photos[i]} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-600 text-2xl">
                      {i === 0 ? profile.display_name?.[0] : ''}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white">{profile.display_name}</h2>
          <p className="text-gray-500">{profile.city || 'No location set'}</p>
          
          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-400 text-sm mt-2 max-w-xs">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="flex gap-8 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{userFriendships.length}</p>
              <p className="text-xs text-gray-500">Friends</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{participations.length}</p>
              <p className="text-xs text-gray-500">Parties</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stories.length}</p>
              <p className="text-xs text-gray-500">Stories</p>
            </div>
          </div>

          {/* Action Buttons */}
          {currentUser && currentUser.id !== userId && (
            <div className="flex gap-3 mt-6 w-full max-w-xs">
              {isFriend ? (
                <Button
                  className="flex-1 bg-gray-800 text-white hover:bg-gray-700"
                  disabled
                >
                  <Check className="w-4 h-4 mr-2" />
                  Friends
                </Button>
              ) : isPending ? (
                <Button
                  className="flex-1 bg-gray-800 text-gray-400"
                  disabled
                >
                  Request Sent
                </Button>
              ) : (
                <Button
                  onClick={() => addFriendMutation.mutate()}
                  disabled={addFriendMutation.isPending}
                  className="flex-1 bg-[#00fea3] text-[#0b0b0b] hover:bg-[#00fea3]/90"
                >
                  {addFriendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </>
                  )}
                </Button>
              )}
              
              {isFriend && (
                <Button
                  onClick={() => navigate(createPageUrl('Chat') + `?userId=${userId}`)}
                  variant="outline"
                  className="flex-1 border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Vibes */}
        {profile.vibes?.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">Vibes</h3>
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
      </main>
    </div>
  );
}
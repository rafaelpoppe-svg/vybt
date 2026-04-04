import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, UserPlus, Check, X, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../components/common/LanguageContext';

export default function Friends() {
  const navigate = useNavigate();
  const {t} = useLanguage();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {}
    };
    getUser();
  }, []);

  // My friendships (I sent)
  const { data: sentFriendships = [] } = useQuery({
    queryKey: ['sentFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  // Received friend requests
  const { data: receivedFriendships = [] } = useQuery({
    queryKey: ['receivedFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ friend_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 200),
  });

  const profilesMap = userProfiles.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  const acceptedFriends = [
    ...sentFriendships.filter(f => f.status === 'accepted').map(f => ({ ...f, friendUserId: f.friend_id })),
    ...receivedFriendships.filter(f => f.status === 'accepted').map(f => ({ ...f, friendUserId: f.user_id }))
  ];

  const pendingRequests = receivedFriendships.filter(f => f.status === 'pending');

  const acceptMutation = useMutation({
    mutationFn: async ({ friendshipId, requesterId }) => {
      // Actualiza o pedido original para accepted
      await base44.entities.Friendship.update(friendshipId, { status: 'accepted' });
      // Cria a amizade simétrica para que o aceitador também apareça como amigo
      const existing = sentFriendships.find(f => f.friend_id === requesterId && f.status === 'accepted');
      if (!existing) {
        await base44.entities.Friendship.create({
          user_id: currentUser.id,
          friend_id: requesterId,
          status: 'accepted',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sentFriendships']);
      queryClient.invalidateQueries(['receivedFriendships']);
    }
  });

  const declineMutation = useMutation({
    mutationFn: async (friendshipId) => {
      await base44.entities.Friendship.update(friendshipId, { status: 'declined' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['receivedFriendships']);
    }
  });

  return (
    <div 
      className="min-h-screen"
      style={{background: 'var(--bg)'}}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-40 backdrop-blur-lg border-b border-gray-800"
        style={{background: 'var(--bg)', opacity: 0.95}}  
      >
        <div className="p-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-900"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-xl font-bold text-white">Friends</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'friends'
                ? 'bg-[#00c6d2] text-[#0b0b0b]'
                : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            Friends ({acceptedFriends.length})
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all relative ${
              activeTab === 'requests'
                ? 'bg-[#00c6d2] text-[#0b0b0b]'
                : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            Requests
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </motion.button>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {activeTab === 'friends' ? (
          acceptedFriends.length > 0 ? (
            acceptedFriends.map((friendship) => {
              const friend = profilesMap[friendship.friendUserId];
              return (
                <motion.div
                  key={friendship.id}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-3"
                >
                  <div 
                    onClick={() => navigate(createPageUrl('UserProfile') + `?id=${friendship.friendUserId}`)}
                    className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    {friend?.photos?.[0] ? (
                      <img src={friend.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{friend?.display_name?.[0] || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{friend?.display_name || 'User'}</p>
                    {friend?.username && (
                      <p className="text-[#00c6d2] text-xs">@{friend.username}</p>
                    )}
                    <p className="text-gray-500 text-sm">{friend?.city || t.noLocation}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(createPageUrl('Chat') + `?userId=${friendship.friendUserId}`)}
                    className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </motion.div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-8">{t.noFriendsYet}</p>
          )
        ) : (
          pendingRequests.length > 0 ? (
            pendingRequests.map((request) => {
              const requester = profilesMap[request.user_id];
              return (
                <motion.div
                  key={request.id}
                  className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                    {requester?.photos?.[0] ? (
                      <img src={requester.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{requester?.display_name?.[0] || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{requester?.display_name || 'User'}</p>
                    <p className="text-gray-500 text-sm">{t.wantsToBeYourFriend}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                    size="sm"
                    onClick={() => acceptMutation.mutate({ friendshipId: request.id, requesterId: request.user_id })}
                    disabled={acceptMutation.isPending}
                      className="bg-[#00c6d2] text-[#0b0b0b] hover:bg-[#00c6d2]/90"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => declineMutation.mutate(request.id)}
                      disabled={declineMutation.isPending}
                      className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-8">{t.noPendingRequests}</p>
          )
        )}
      </main>
    </div>
  );
}
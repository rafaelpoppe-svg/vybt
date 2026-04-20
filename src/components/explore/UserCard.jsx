import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShieldCheck, UserPlus, Check, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifyFriendRequest, createNotification } from '../notifications/NotificationTriggers';
import { useLanguage } from '../common/LanguageContext';

export default function UserCard({ profile, myProfile, currentUser, isFriend, isPendingSent, mode = 'discover', friendshipId, onAccept }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [localSent, setLocalSent] = useState(isPendingSent);
  const [localAccepted, setLocalAccepted] = useState(false);

  const matchingVibes = myProfile?.vibes?.filter(v => profile.vibes?.includes(v)) || [];
  const matchingPartyTypes = myProfile?.party_types?.filter(pt => profile.party_types?.includes(pt)) || [];
  const totalCompatible = matchingVibes.length + matchingPartyTypes.length;
  const totalMine = (myProfile?.vibes?.length || 0) + (myProfile?.party_types?.length || 0);
  const matchPct = totalMine > 0 ? Math.round((totalCompatible / totalMine) * 100) : 0;

  const sendRequest = useMutation({
    mutationFn: async () => {
      await base44.entities.Friendship.create({
        user_id: currentUser.id,
        friend_id: profile.user_id,
        status: 'pending'
      });
      await notifyFriendRequest(profile.user_id, currentUser.id, currentUser.full_name || t.someone);
    },
    onSuccess: () => {
      setLocalSent(true);
      queryClient.invalidateQueries(['sentFriendRequests', currentUser?.id]);
    }
  });

  const acceptRequest = useMutation({
    mutationFn: async () => {
      await base44.entities.Friendship.update(friendshipId, { status: 'accepted' });
      const existing = await base44.entities.Friendship.filter({ user_id: currentUser.id, friend_id: profile.user_id });
      if (existing.length === 0) {
        await base44.entities.Friendship.create({ user_id: currentUser.id, friend_id: profile.user_id, status: 'accepted' });
      }
      await createNotification(profile.user_id, 'friend_request', `${currentUser.full_name || t.someone} aceitou o teu pedido de amizade! 🎉`, { relatedUserId: currentUser.id });
    },
    onSuccess: () => {
      setLocalAccepted(true);
      queryClient.invalidateQueries(['receivedFriendRequestsExplore', currentUser?.id]);
      queryClient.invalidateQueries(['myFriendshipsExplore', currentUser?.id]);
      if (onAccept) onAccept();
    }
  });

  const handleAction = (e) => {
    e.stopPropagation();
    if (mode === 'request') {
      if (!localAccepted) acceptRequest.mutate();
    } else {
      if (!localSent && !isFriend) sendRequest.mutate();
    }
  };

  const showButton = currentUser?.id !== profile.user_id && !isFriend;

  // Match color gradient based on percentage
  const matchGradient = matchPct >= 70
    ? 'linear-gradient(135deg, #00c6d2, #542b9b)'
    : matchPct >= 40
      ? 'linear-gradient(135deg, #542b9b, #a855f7)'
      : 'rgba(255,255,255,0.1)';

  const allMatchTags = [
    ...matchingVibes.map(v => ({ label: v, color: '#00c6d2' })),
    ...matchingPartyTypes.map(pt => ({ label: pt, color: '#a855f7' })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(createPageUrl('UserProfile') + `?id=${profile.user_id}`)}
      className="relative rounded-2xl overflow-hidden cursor-pointer border border-white/8"
      style={{ aspectRatio: '3/4' }}
    >
      {/* Photo */}
      {profile.photos?.[0] ? (
        <img src={profile.photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#542b9b] to-[#00c6d2]/30 flex items-center justify-center">
          <span className="text-5xl text-white/80 font-black">{profile.display_name?.[0] || '?'}</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

      {/* Match score badge — top-left */}
      {matchPct > 0 && (
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-black backdrop-blur-sm"
          style={{ background: matchGradient, color: 'white' }}
        >
          {matchPct >= 70 ? '🔥' : matchPct >= 40 ? '✨' : '👋'} {matchPct}%
        </div>
      )}

      {/* Verified badge — top-right */}
      {profile.is_verified && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#00c6d2]/20 backdrop-blur-sm flex items-center justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00c6d2]" />
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <div className="flex items-end justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm truncate leading-tight">
              {profile.display_name || t.user}
            </p>
            {profile.username && (
              <p className="text-[#00c6d2] text-[9px] font-medium truncate">@{profile.username}</p>
            )}
            {profile.city && (
              <p className="text-gray-400 text-[9px] flex items-center gap-0.5 mt-0.5">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{profile.city}
              </p>
            )}

            {/* Match tags */}
            {allMatchTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {allMatchTags.slice(0, 2).map((tag, i) => (
                  <span
                    key={i}
                    className="text-[8px] px-1.5 py-0.5 rounded-full font-bold truncate max-w-[60px]"
                    style={{ background: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}44` }}
                  >
                    {tag.label}
                  </span>
                ))}
                {allMatchTags.length > 2 && (
                  <span className="text-[8px] text-gray-500 self-center">+{allMatchTags.length - 2}</span>
                )}
              </div>
            )}
          </div>

          {showButton && (
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleAction}
              disabled={acceptRequest.isPending || sendRequest.isPending}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              style={
                mode === 'request'
                  ? { background: localAccepted ? 'rgba(0,198,210,0.3)' : 'linear-gradient(135deg, #00c6d2, #542b9b)' }
                  : localSent
                    ? { background: 'rgba(0,198,210,0.15)', border: '1px solid rgba(0,198,210,0.4)' }
                    : { background: 'linear-gradient(135deg, #00c6d2, #542b9b)' }
              }
            >
              {mode === 'request'
                ? <Check className="w-3.5 h-3.5 text-white" />
                : localSent
                  ? <Check className="w-3.5 h-3.5 text-[#00c6d2]" />
                  : <UserPlus className="w-3.5 h-3.5 text-white" />
              }
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
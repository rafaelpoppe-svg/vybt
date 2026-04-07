import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Check, MapPin, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifyFriendRequest } from '../notifications/NotificationTriggers';
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

  const allMatchTags = [
    ...matchingVibes.map(v => ({ label: v, color: '#00c6d2' })),
    ...matchingPartyTypes.map(pt => ({ label: pt, color: '#a855f7' })),
  ];

  const sendRequest = useMutation({
    mutationFn: async () => {
      await base44.entities.Friendship.create({
        user_id: currentUser.id,
        friend_id: profile.user_id,
        status: 'pending'
      });
      const myName = currentUser.full_name || t.someone;
      await notifyFriendRequest(profile.user_id, currentUser.id, myName);
    },
    onSuccess: () => {
      setLocalSent(true);
      queryClient.invalidateQueries(['sentFriendRequests', currentUser?.id]);
    }
  });

  const acceptRequest = useMutation({
    mutationFn: () => base44.entities.Friendship.update(friendshipId, { status: 'accepted' }),
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

  const buttonLabel = mode === 'request'
    ? localAccepted ? '✓' : <Check className="w-3.5 h-3.5 text-white" />
    : localSent ? <Check className="w-3.5 h-3.5 text-[#00c6d2]" /> : <Plus className="w-4 h-4 text-white" />;

  const buttonStyle = mode === 'request'
    ? { background: localAccepted ? 'rgba(0,198,210,0.3)' : 'linear-gradient(135deg, #00c6d2, #542b9b)', border: 'none' }
    : localSent
      ? { background: 'rgba(0,198,210,0.15)', border: '1px solid rgba(0,198,210,0.4)' }
      : { background: 'linear-gradient(135deg, #00c6d2, #542b9b)', border: 'none' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(createPageUrl('UserProfile') + `?id=${profile.user_id}`)}
      className="relative rounded-2xl overflow-hidden cursor-pointer border border-white/5"
      style={{ aspectRatio: '3/4' }}
    >
      {/* Photo */}
      {profile.photos?.[0] ? (
        <img src={profile.photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#542b9b] to-[#00c6d2]/30 flex items-center justify-center">
          <span className="text-5xl text-white font-bold">{profile.display_name?.[0] || '?'}</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />

      {/* Match badge top-left */}
      {matchPct > 0 && (
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{
            background: matchPct >= 60
              ? 'linear-gradient(135deg, rgba(0,198,210,0.85), rgba(84,43,155,0.85))'
              : 'rgba(0,0,0,0.65)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(6px)'
          }}
        >
          {matchPct}% match
        </div>
      )}

      {/* Verified badge */}
      {profile.is_verified && (
        <div className="absolute top-2 right-2">
          <ShieldCheck className="w-4 h-4 text-[#00c6d2] drop-shadow" />
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-sm truncate leading-tight">{profile.display_name || t.user}</p>
            {profile.username && (
              <p className="text-[#00c6d2] text-[10px] font-medium truncate leading-tight">@{profile.username}</p>
            )}
            {profile.city && (
              <p className="text-gray-400 text-[10px] flex items-center gap-0.5 mt-0.5">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                {profile.city}
              </p>
            )}

            {allMatchTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {allMatchTags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold truncate max-w-[64px]"
                    style={{
                      background: `${tag.color}22`,
                      color: tag.color,
                      border: `1px solid ${tag.color}44`
                    }}
                  >
                    {tag.label}
                  </span>
                ))}
                {allMatchTags.length > 3 && (
                  <span className="text-[9px] text-gray-400 self-center">+{allMatchTags.length - 3}</span>
                )}
              </div>
            )}
          </div>

          {showButton && (
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleAction}
              disabled={acceptRequest.isPending || sendRequest.isPending}
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
              style={buttonStyle}
            >
              {buttonLabel}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
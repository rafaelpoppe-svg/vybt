import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { UserPlus, Check, Music2, MapPin, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function UserCard({ profile, myProfile, currentUser, isFriend, isPendingSent }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localSent, setLocalSent] = useState(isPendingSent);

  const matchingVibes = myProfile?.vibes?.filter(v => profile.vibes?.includes(v)) || [];
  const matchingPartyTypes = myProfile?.party_types?.filter(pt => profile.party_types?.includes(pt)) || [];
  const totalCompatible = matchingVibes.length + matchingPartyTypes.length;
  const totalMine = (myProfile?.vibes?.length || 0) + (myProfile?.party_types?.length || 0);
  const matchPct = totalMine > 0 ? Math.round((totalCompatible / totalMine) * 100) : 0;

  const sendRequest = useMutation({
    mutationFn: () => base44.entities.Friendship.create({
      user_id: currentUser.id,
      friend_id: profile.user_id,
      status: 'pending'
    }),
    onSuccess: () => {
      setLocalSent(true);
      queryClient.invalidateQueries(['sentFriendRequests', currentUser?.id]);
    }
  });

  const handleAddFriend = (e) => {
    e.stopPropagation();
    if (!localSent && !isFriend) sendRequest.mutate();
  };

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

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Match badge top-left */}
      {matchPct > 0 && (
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{
            background: matchPct >= 70
              ? 'linear-gradient(135deg, #00c6d2cc, #542b9bcc)'
              : 'rgba(0,0,0,0.6)',
            color: matchPct >= 70 ? '#fff' : '#aaa',
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
            <p className="text-white font-semibold text-sm truncate leading-tight">{profile.display_name || 'User'}</p>
            {profile.city && (
              <p className="text-gray-400 text-[10px] flex items-center gap-0.5 mt-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {profile.city}
              </p>
            )}

            {/* Matching vibes */}
            {matchingVibes.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <Music2 className="w-3 h-3 text-[#00c6d2] flex-shrink-0" />
                {matchingVibes.slice(0, 2).map(v => (
                  <span key={v} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#00c6d2]/20 text-[#00c6d2] font-medium border border-[#00c6d2]/30 truncate max-w-[60px]">
                    {v}
                  </span>
                ))}
                {matchingVibes.length > 2 && (
                  <span className="text-[9px] text-gray-400">+{matchingVibes.length - 2}</span>
                )}
              </div>
            )}
          </div>

          {/* Add friend button */}
          {!isFriend && currentUser?.id !== profile.user_id && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleAddFriend}
              disabled={localSent || sendRequest.isPending}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: localSent
                  ? 'rgba(0,198,210,0.2)'
                  : 'linear-gradient(135deg, #00c6d2, #542b9b)',
                border: localSent ? '1px solid rgba(0,198,210,0.4)' : 'none'
              }}
            >
              {localSent
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
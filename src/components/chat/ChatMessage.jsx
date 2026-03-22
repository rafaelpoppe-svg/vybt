import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Check, CheckCheck } from 'lucide-react';
import CommunityInviteCard from './CommunityInviteCard';
import PlanInviteCard from './PlanInviteCard';

const QUICK_REACTIONS = ['❤️', '😂', '🔥', '😍', '👏', '😮'];

export default function ChatMessage({ message, isMe, sender, showProfile = true, onReact }) {
  const [liked, setLiked] = useState(message.liked || false);
  const [likeCount, setLikeCount] = useState(message.like_count || 0);
  const [showReactions, setShowReactions] = useState(false);
  const [reaction, setReaction] = useState(message.reaction || null);

  const isSticker = message.content?.startsWith('sticker:');
  const stickerUrl = isSticker ? message.content.replace('sticker:', '') : null;

  const isCommunityInvite = message.content?.startsWith('community_invite:');
  const communityInviteId = isCommunityInvite ? message.content.replace('community_invite:', '') : null;

  const isPlanInvite = message.content?.startsWith('plan_invite:');
  const planInviteId = isPlanInvite ? message.content.replace('plan_invite:', '') : null;

  // Story reply: "story_reply:<id>:<url>:<type>\n<message>"
  const isStoryReply = message.content?.startsWith('story_reply:');
  let storyReplyData = null;
  let displayContent = message.content;
  if (isStoryReply) {
    const lines = message.content.split('\n');
    const parts = lines[0].split(':');
    // parts: ['story_reply', id, ...url parts..., type]
    // url may contain colons (https://...), so we reconstruct carefully
    const afterPrefix = lines[0].slice('story_reply:'.length); // "id:url:type"
    const firstColon = afterPrefix.indexOf(':');
    const rest = afterPrefix.slice(firstColon + 1); // "url:type"
    const lastColon = rest.lastIndexOf(':');
    storyReplyData = {
      id: afterPrefix.slice(0, firstColon),
      url: rest.slice(0, lastColon),
      type: rest.slice(lastColon + 1),
    };
    displayContent = lines.slice(1).join('\n');
  }

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : Math.max(0, c - 1));
    onReact?.(message.id, next ? '❤️' : null);
  };

  const handleReaction = (emoji) => {
    const next = reaction === emoji ? null : emoji;
    setReaction(next);
    setShowReactions(false);
    onReact?.(message.id, next);
  };

  const Avatar = ({ size = 'sm' }) => {
    const s = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
    return (
      <div className={`${s} rounded-full overflow-hidden flex-shrink-0`}>
        {sender?.photos?.[0] ? (
          <img src={sender.photos[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00c6d2] flex items-center justify-center">
            <span className="text-white text-xs font-bold">{sender?.display_name?.[0] || '?'}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex gap-2 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar - only for the other person */}
      {!isMe && <Avatar />}


      <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className="relative">
          {isCommunityInvite ? (
            <CommunityInviteCard communityId={communityInviteId} />
          ) : isSticker ? (
            <motion.div whileTap={{ scale: 0.95 }} className="w-24 h-24">
              <img src={stickerUrl} alt="sticker" className="w-full h-full object-contain" />
            </motion.div>
          ) : isStoryReply ? (
            <motion.div
              whileTap={{ scale: 0.97 }}
              onContextMenu={(e) => { e.preventDefault(); setShowReactions(v => !v); }}
              className={`rounded-2xl overflow-hidden cursor-pointer select-none border ${
                isMe ? 'rounded-br-sm border-[#00c6d2]/40' : 'rounded-bl-sm border-gray-700/40'
              }`}
              style={{ maxWidth: 220 }}
            >
              {/* Story thumbnail */}
              <div className="relative w-full" style={{ aspectRatio: '9/16', maxHeight: 180 }}>
                {storyReplyData.type === 'video'
                  ? <video src={storyReplyData.url} className="w-full h-full object-cover" muted playsInline />
                  : <img src={storyReplyData.url} alt="" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex items-end p-2">
                  <span className="text-white text-[10px] opacity-70">Story</span>
                </div>
              </div>
              {/* Message text */}
              {displayContent && (
                <div className={`px-3 py-2 ${isMe ? 'bg-gradient-to-br from-[#00c6d2] to-[#0096a8] text-[#0b0b0b]' : 'bg-gray-800 text-white'}`}>
                  <p className="text-sm leading-relaxed">{displayContent}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              whileTap={{ scale: 0.97 }}
              onContextMenu={(e) => { e.preventDefault(); setShowReactions(v => !v); }}
              onDoubleClick={handleLike}
              className={`px-4 py-2.5 rounded-2xl cursor-pointer select-none ${
                isMe
                  ? 'rounded-br-sm bg-gradient-to-br from-[#00c6d2] to-[#0096a8] text-[#0b0b0b]'
                  : 'rounded-bl-sm bg-gradient-to-br from-gray-800 to-gray-900 text-white border border-gray-700/40'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </motion.div>
          )}

          {/* Reaction badge */}
          {reaction && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => handleReaction(reaction)}
              className={`absolute -bottom-3 ${isMe ? '-left-2' : '-right-2'} bg-gray-800 border border-gray-700 rounded-full px-1.5 py-0.5 text-xs`}
            >
              {reaction}
            </motion.button>
          )}
        </div>

        {/* Quick reactions popup */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 6 }}
              className={`flex gap-1 bg-gray-900 border border-gray-700 rounded-full px-2 py-1.5 mt-1 shadow-xl z-10`}
            >
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`text-lg w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-125 ${reaction === emoji ? 'bg-gray-700' : ''}`}
                >
                  {emoji}
                </button>
              ))}
              {/* close */}
              <button onClick={() => setShowReactions(false)} className="text-gray-500 text-xs px-1">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Meta row: time + like + read */}
        <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-gray-600">
            {format(new Date(message.created_date), 'HH:mm')}
          </span>
          {isMe && (
            message.is_read
              ? <CheckCheck className="w-3 h-3 text-[#00c6d2]" />
              : <Check className="w-3 h-3 text-gray-600" />
          )}
          {/* Like button (only visible on hover or if liked) */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            className={`flex items-center gap-0.5 transition-all ${liked ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
          >
            <Heart className={`w-3 h-3 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
            {likeCount > 0 && <span className="text-[10px] text-gray-500">{likeCount}</span>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
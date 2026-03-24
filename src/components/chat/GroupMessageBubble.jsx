import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import CommunityInviteCard from './CommunityInviteCard';
import PlanInviteCard from './PlanInviteCard';
import { useLanguage } from '../common/LanguageContext';

function Avatar({ sender }) {
  return sender?.photos?.[0] ? (
    <img src={sender.photos[0]} alt="" className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-white text-xs font-bold">{sender?.display_name?.[0] || '?'}</span>
    </div>
  );
}

export default function GroupMessageBubble({ message, isMe, sender, isFirstInGroup, isLastInGroup, themeColor = '#00fea3' }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isSticker = message.content?.startsWith('sticker:');
  const stickerUrl = isSticker ? message.content.replace('sticker:', '') : null;
  const isCommunityInvite = message.content?.startsWith('community_invite:');
  const communityInviteId = isCommunityInvite ? message.content.replace('community_invite:', '') : null;
  const isPlanInvite = message.content?.startsWith('plan_invite:');
  const planInviteId = isPlanInvite ? message.content.replace('plan_invite:', '') : null;
  const isCard = isCommunityInvite || isPlanInvite;

  // ── Plan update system message (WhatsApp-style center notification) ──
  const isPlanUpdate = message.content?.startsWith('plan_update:');
  if (isPlanUpdate) {
    const lines = message.content.replace('plan_update:', '').split('\n').filter(Boolean);
    return (
      <div className="flex justify-center my-3">
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl px-4 py-2.5 max-w-[85%] border border-gray-700/40">
          <p className="text-[11px] text-gray-400 font-semibold text-center mb-1.5">{t.planUpdated}</p>
          {lines.map((line, i) => (
            <p key={i} className="text-[11px] text-gray-300 text-center leading-relaxed">{line}</p>
          ))}
          <p className="text-[10px] text-gray-600 text-center mt-1.5">
            {format(new Date(message.created_date), 'HH:mm')}
          </p>
        </div>
      </div>
    );
  }

  if (isMe) {
    return (
      <div className={`flex justify-end items-end gap-2 ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}>
        <div className="max-w-[72%]">
          {isSticker ? (
            <img src={stickerUrl} alt="sticker" className="w-28 h-28 object-contain ml-auto" />
          ) : isCommunityInvite ? (
            <CommunityInviteCard communityId={communityInviteId} />
          ) : isPlanInvite ? (
            <PlanInviteCard planId={planInviteId} />
          ) : (
            <div
              className={`px-4 py-2.5 text-[#0b0b0b] text-sm leading-relaxed shadow-sm
                ${isFirstInGroup ? 'rounded-t-2xl' : 'rounded-t-lg'}
                ${isLastInGroup ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-b-lg'}`}
              style={{ backgroundColor: themeColor }}
            >
              {message.content}
            </div>
          )}
          {isLastInGroup && (
            <p className="text-[10px] text-gray-600 mt-1 text-right mr-1">
              {format(new Date(message.created_date), 'HH:mm')}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}>
      {/* Avatar col */}
      <div className="w-8 flex-shrink-0">
        {isLastInGroup ? (
          <div
            className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden cursor-pointer"
            onClick={() => sender?.user_id && navigate(createPageUrl('UserProfile') + `?id=${sender.user_id}`)}
          >
            <Avatar sender={sender} />
          </div>
        ) : null}
      </div>

      <div className="max-w-[72%]">
        {isFirstInGroup && (
          <p className="text-xs font-semibold mb-1 ml-1" style={{ color: themeColor }}>
            {sender?.display_name || 'User'}
          </p>
        )}
        {isSticker ? (
          <img src={stickerUrl} alt="sticker" className="w-28 h-28 object-contain" />
        ) : isCommunityInvite ? (
          <CommunityInviteCard communityId={communityInviteId} />
        ) : isPlanInvite ? (
          <PlanInviteCard planId={planInviteId} />
        ) : (
          <div
            className={`px-4 py-2.5 bg-gray-800/90 text-white text-sm leading-relaxed shadow-sm
              ${isFirstInGroup ? 'rounded-t-2xl' : 'rounded-t-lg'}
              ${isLastInGroup ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-b-lg'}`}
          >
            {message.content}
          </div>
        )}
        {isLastInGroup && (
          <p className="text-[10px] text-gray-600 mt-1 ml-1">
            {format(new Date(message.created_date), 'HH:mm')}
          </p>
        )}
      </div>
    </div>
  );
}
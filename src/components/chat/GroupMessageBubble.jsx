import React from 'react';
import { format } from 'date-fns';

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
  const isSticker = message.content?.startsWith('sticker:');
  const stickerUrl = isSticker ? message.content.replace('sticker:', '') : null;

  if (isMe) {
    return (
      <div className={`flex justify-end items-end gap-2 ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}>
        <div className="max-w-[72%]">
          {isSticker ? (
            <img src={stickerUrl} alt="sticker" className="w-28 h-28 object-contain ml-auto" />
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
          <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden">
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
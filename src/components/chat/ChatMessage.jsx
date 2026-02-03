import React from 'react';
import { format } from 'date-fns';

export default function ChatMessage({ message, isMe, sender, showProfile = true }) {
  const isSticker = message.content?.startsWith('sticker:');
  const stickerUrl = isSticker ? message.content.replace('sticker:', '') : null;

  return (
    <div className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {/* Profile pic for others in group */}
      {!isMe && showProfile && (
        <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0 overflow-hidden">
          {sender?.photos?.[0] ? (
            <img src={sender.photos[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {sender?.display_name?.[0] || '?'}
              </span>
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[70%] ${isMe ? 'order-2' : ''}`}>
        {!isMe && showProfile && (
          <p className="text-xs text-gray-500 mb-1 ml-1">
            {sender?.display_name || 'User'}
          </p>
        )}
        
        {isSticker ? (
          <div className="w-24 h-24">
            <img src={stickerUrl} alt="sticker" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isMe
                ? 'bg-[#00fea3] text-[#0b0b0b]'
                : 'bg-gray-800 text-white'
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>
        )}
        
        <p className={`text-[10px] text-gray-600 mt-1 ${isMe ? 'text-right mr-2' : 'ml-2'}`}>
          {format(new Date(message.created_date), 'HH:mm')}
        </p>
      </div>

      {/* Profile pic for self */}
      {isMe && showProfile && (
        <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0 overflow-hidden">
          {sender?.photos?.[0] ? (
            <img src={sender.photos[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {sender?.display_name?.[0] || '?'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
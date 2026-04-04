import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Check, HelpCircle } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

function Avatar({ profile, size = 'md', onClick }) {
  const s = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm';

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className={`${s} rounded-full overflow-hidden border-2 border-gray-800 bg-gray-700`}>
        {profile?.photos?.[0] ? (
          <img src={profile.photos[0]} alt={profile.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#542b9b] to-[#00c6d2] text-white font-bold">
            {profile?.display_name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      <span className="text-[10px] text-gray-400 max-w-[40px] truncate">{profile?.display_name}</span>
    </button>
  );
}

export default function AttendingAvatars({ participants, profilesMap, themeColor = '#00c6d2' }) {
  const navigate = useNavigate();

  const going = participants.filter(p => p.status === 'going' || !p.status);
  const maybe = participants.filter(p => p.status === 'maybe');
    const {t} = useLanguage();
  if (participants.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Going */}
      {going.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-5 h-5 rounded-full" style={{ background: themeColor }}>
              <Check className="w-3 h-3 text-[#0b0b0b]" />
            </div>
            <span className="text-white font-semibold text-sm">{going.length} {t.going}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {going.map(p => (
              <Avatar
                key={p.id}
                profile={profilesMap[p.user_id]}
                onClick={() => navigate(createPageUrl('UserProfile') + `?id=${p.user_id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Maybe */}
      {maybe.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500/20">
              <HelpCircle className="w-3 h-3 text-yellow-400" />
            </div>
            <span className="text-gray-400 font-semibold text-sm">{maybe.length} Maybe</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {maybe.map(p => (
              <Avatar
                key={p.id}
                profile={profilesMap[p.user_id]}
                size="sm"
                onClick={() => navigate(createPageUrl('UserProfile') + `?id=${p.user_id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
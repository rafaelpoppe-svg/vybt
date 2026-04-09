import React from 'react';
import { Sparkles, Users, MapPin, Music } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

export default function RecommendationBadge({ reasons = [], score }) {
  const { t } = useLanguage();

  const reasonIcons = {
    vibes: Music,
    party_type: Sparkles,
    friends: Users,
    location: MapPin,
  };

  const reasonLabels = {
    vibes: t.reasonVibes,
    party_type: t.reasonPartyType,
    friends: t.reasonFriends,
    location: t.reasonLocation,
  };

  const topReason = reasons[0];
  if (!topReason) return null;

  const Icon = reasonIcons[topReason] || Sparkles;
  const label = reasonLabels[topReason] || t.reasonRecommended;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-[#00fea3]/20 to-[#542b9b]/20 border border-[#00fea3]/30">
      <Icon className="w-3 h-3 text-[#00fea3]" />
      <span className="text-[10px] text-[#00fea3] font-medium">{label}</span>
      {score && score > 80 && (
        <span className="text-[10px] text-[#542b9b] font-bold">{score}%</span>
      )}
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Sparkles, Calendar, Heart, Music, Flame } from 'lucide-react';
import { format } from 'date-fns';
import PlanCountdown from '../plan/PlanCountdown';

const reasonIcons = {
  vibes: Music,
  party_type: Sparkles,
  friends: Users,
  location: MapPin
};

const reasonLabels = {
  vibes: 'Matches your vibes',
  party_type: 'Your style',
  friends: 'Friends going',
  location: 'Near you'
};

export default function PlanCard({ plan, participants = [], onClick, featured = false, matchScore, matchReasons, isOnFire = false }) {
  const themeColor = plan.theme_color || '#542b9b';
  
  const getHexWithAlpha = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const cardBgColor = featured ? getHexWithAlpha(themeColor, 0.2) : 'rgb(31, 41, 55)';
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`rounded-2xl overflow-hidden cursor-pointer border border-gray-800 hover:border-gray-700 transition-all`}
      style={{
        backgroundColor: cardBgColor
      }}
    >
      {/* Cover Image */}
      <div className="relative h-40">
        {plan.cover_image ? (
          <img 
            src={plan.cover_image} 
            alt={plan.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00fea3]/50 flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
        )}
        
        {/* Badges - can show multiple */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {plan.status === 'terminated' && (
            <div className="px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-sm flex items-center gap-1">
              <span className="text-xs">❌</span>
              <span className="text-xs text-white font-bold">Encerrado</span>
            </div>
          )}
          {plan.status !== 'terminated' && (
            <>
              {plan.is_highlighted && (
                <div className="px-2 py-1 rounded-full bg-gradient-to-r from-[#00fea3]/80 to-[#542b9b]/80 backdrop-blur-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span className="text-[10px] text-white font-medium">Highlighted</span>
                </div>
              )}
              {isOnFire && (
                <div className="px-2 py-1 rounded-full bg-orange-500/80 backdrop-blur-sm flex items-center gap-1">
                  <span className="text-xs">🔥</span>
                  <span className="text-[10px] text-white font-medium">On Fire</span>
                </div>
              )}
              {matchScore && matchScore > 30 && !plan.is_highlighted && !isOnFire && (
                <div className="px-2 py-1 rounded-full bg-[#542b9b]/80 backdrop-blur-sm flex items-center gap-1">
                  <Heart className="w-3 h-3 text-white" />
                  <span className="text-[10px] text-white font-medium">{matchScore}%</span>
                </div>
              )}
            </>
          )}
        </div>
        
        {matchReasons && matchReasons.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {matchReasons.slice(0, 2).map((reason) => {
              const Icon = reasonIcons[reason] || Sparkles;
              return (
                <div key={reason} className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-1">
                  <Icon className="w-2.5 h-2.5 text-[#00fea3]" />
                  <span className="text-[9px] text-white/90">{reasonLabels[reason]}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {plan.tags?.slice(0, 2).map((tag, i) => (
                <span 
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-[#00fea3]/20 text-[#00fea3] text-[10px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <PlanCountdown plan={plan} size="sm" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="text-white font-bold text-lg line-clamp-1">{plan.title}</h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{format(new Date(plan.date), 'EEE, MMM d')}</span>
            <Clock className="w-4 h-4 ml-2" />
            <span className="text-sm">{plan.time}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm line-clamp-1">{plan.location_address}</span>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((p, i) => (
                <div 
                  key={i}
                  className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center"
                >
                  <span className="text-[10px] text-white">
                    {p.display_name?.[0] || '?'}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {participants.length} going
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-gray-500">
            <Users className="w-4 h-4" />
            <span className="text-xs">{plan.view_count || 0} views</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
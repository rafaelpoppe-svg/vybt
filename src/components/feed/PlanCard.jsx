import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Users, Sparkles, Calendar, Heart, Music, Flame, Zap } from 'lucide-react';
import { format } from 'date-fns';

function useLiveCountdown(plan) {
  const [state, setState] = useState({ isLive: false, timeLeft: null });
  useEffect(() => {
    const calc = () => {
      if (!plan.date || !plan.time) { setState({ isLive: false, timeLeft: null }); return; }
      if (['ended', 'terminated', 'voting'].includes(plan.status)) { setState({ isLive: false, timeLeft: null }); return; }
      const now = new Date();
      const start = new Date(`${plan.date}T${plan.time}:00`);
      const end = plan.end_time
        ? new Date(`${plan.date}T${plan.end_time}:00`)
        : new Date(start.getTime() + 8 * 60 * 60 * 1000);
      if (now >= start && now <= end) {
        const diff = end - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const timeLeft = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
        setState({ isLive: true, timeLeft });
      } else {
        setState({ isLive: false, timeLeft: null });
      }
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [plan]);
  return state;
}

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

export default function PlanCard({ plan, participants = [], onClick, featured = false, matchScore, matchReasons, isOnFire = false, currentUserId, community }) {
  const themeColor = plan.theme_color || '#542b9b';
  const { isLive, timeLeft } = useLiveCountdown(plan);
  const isHappening = isLive;
  const isMyPlan = currentUserId && plan.creator_id === currentUserId;
  
  const getHexWithAlpha = (hex, alpha) => {
    if (!hex || hex.length < 7) return `rgba(84,43,155,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const cardBgColor = getHexWithAlpha(themeColor, 0.15);
  const borderColor = isHappening
    ? 'rgba(249,115,22,0.5)'
    : isOnFire
    ? 'rgba(239,68,68,0.4)'
    : getHexWithAlpha('#00c6d2', 0.15);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ scale: 1.025, y: -4, boxShadow: `0 16px 48px ${getHexWithAlpha(themeColor, 0.4)}, 0 0 0 1px ${getHexWithAlpha('#00c6d2', 0.2)}` }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`rounded-3xl overflow-hidden cursor-pointer border transition-all`}
      style={{
        backgroundColor: cardBgColor,
        borderColor,
        boxShadow: isHappening
          ? '0 0 20px rgba(249,115,22,0.25)'
          : isOnFire
          ? '0 0 16px rgba(239,68,68,0.2)'
          : undefined,
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
          <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00c6d2]/50 flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
        )}
        
        {/* Happening Now pulsing overlay */}
        {isHappening && (
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, transparent 60%)' }}
          />
        )}

        {/* Badges - can show multiple */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {isMyPlan && (
            <div className="px-3 py-1.5 rounded-full bg-[#00c6d2]/90 backdrop-blur-sm flex items-center gap-1">
              <span className="text-xs">👤</span>
              <span className="text-xs text-[#0b0b0b] font-bold">My Plan</span>
            </div>
          )}
          {plan.status === 'terminated' && (
            <div className="px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-sm flex items-center gap-1">
              <span className="text-xs">❌</span>
              <span className="text-xs text-white font-bold">Terminated</span>
            </div>
          )}
          {plan.status !== 'terminated' && (
            <>
              {isHappening && (
                 <motion.div
                   animate={{ scale: [1, 1.06, 1] }}
                   transition={{ repeat: Infinity, duration: 1.5 }}
                   className="px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5"
                   style={{ background: 'rgba(249,115,22,0.9)' }}
                 >
                   <motion.span
                     animate={{ opacity: [1, 0.3, 1] }}
                     transition={{ repeat: Infinity, duration: 1 }}
                     className="text-xs"
                   >⚡</motion.span>
                   <span className="text-[10px] text-white font-bold tracking-wide">LIVE NOW</span>
                   {timeLeft && <span className="text-[10px] text-white/75">· {timeLeft}</span>}
                 </motion.div>
               )}
              {plan.is_highlighted && (
                <div className="px-2 py-1 rounded-full bg-gradient-to-r from-[#00c6d2]/80 to-[#542b9b]/80 backdrop-blur-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span className="text-[10px] text-white font-medium">Highlighted</span>
                </div>
              )}
              {isOnFire && !isHappening && (
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="px-2 py-1 rounded-full bg-red-500/85 backdrop-blur-sm flex items-center gap-1"
                >
                  <motion.span
                    animate={{ rotate: [-5, 5, -5] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="text-xs"
                  >🔥</motion.span>
                  <span className="text-[10px] text-white font-bold">On Fire</span>
                </motion.div>
              )}
              {matchScore && matchScore > 30 && !plan.is_highlighted && !isOnFire && !isHappening && (
                <div className="px-2 py-1 rounded-full bg-[#542b9b]/80 backdrop-blur-sm flex items-center gap-1">
                  <Heart className="w-3 h-3 text-white" />
                  <span className="text-[10px] text-white font-medium">{matchScore}%</span>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Community badge */}
        {community && plan.community_id && (
          <div className="absolute top-3 left-3">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm border text-[10px] font-bold text-white"
              style={{ background: `${community.theme_color || '#00c6d2'}cc`, borderColor: `${community.theme_color || '#00c6d2'}50` }}
            >
              <span>⭐</span>
              <span className="max-w-[80px] truncate">{community.name}</span>
            </div>
          </div>
        )}

        {matchReasons && matchReasons.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {matchReasons.slice(0, 2).map((reason) => {
              const Icon = reasonIcons[reason] || Sparkles;
              return (
                <motion.div
                  key={reason}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm flex items-center gap-1 border border-[#00c6d2]/20"
                >
                  <Icon className="w-2.5 h-2.5 text-[#00c6d2]" />
                  <span className="text-[9px] text-white/90">{reasonLabels[reason]}</span>
                </motion.div>
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
                  className="px-2 py-0.5 rounded-full bg-[#00c6d2]/20 text-[#00c6d2] text-[10px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-lg line-clamp-1 tracking-tight" style={{ color: 'var(--text-primary)' }}>{plan.title}</h3>
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
              <Calendar className="w-3 h-3 text-[#00c6d2]" />
              {format(new Date(plan.date), 'EEE, MMM d')}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
              <Clock className="w-3 h-3 text-[#00c6d2]" />
              {plan.time}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <MapPin className="w-3.5 h-3.5 text-[#00c6d2]/70 flex-shrink-0" />
            <span className="line-clamp-1">{plan.location_address}</span>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((p, i) => (
                <div 
                  key={i}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00c6d2]/30 to-[#542b9b]/30 border-2 flex items-center justify-center"
                  style={{ borderColor: 'var(--bg)' }}
                >
                  <span className="text-[10px] text-white font-bold">
                    {p.display_name?.[0] || '?'}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-xs font-medium text-[#00c6d2]/80">
              {participants.length} going
            </span>
          </div>
          
          <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs">{plan.view_count || 0}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
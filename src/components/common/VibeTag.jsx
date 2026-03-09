import React from 'react';
import { motion } from 'framer-motion';
import { 
  Disc3, Music, Radio, Zap, Flame, Drum, 
  Sparkles, Guitar, Heart, AudioWaveform, Diamond, Flag,
  Music2, Headphones, Mic, Mic2, Globe, Star, Wind, 
  Waves, Moon, Sun, Shuffle, Volume2, Activity
} from 'lucide-react';

export const ALL_VIBES = [
  'Reggaeton', 'Funk BR', 'Afrobeat', 'Amapiano', 'House', 'Tech House',
  'Afro House', 'Techno', 'EDM', 'Mainstream', 'Pop', 'Hip-Hop',
  'R&B', 'Trap', 'Latin', 'Salsa', 'Bachata', 'Dembow',
  'Dancehall', 'Drill', 'Indie', 'Rock', 'Alternative', 'K-pop',
  'Deep House', 'Hard Techno', 'DnB', 'UK Garage', 'Throwbacks',
  'Portuguese Hits', 'Spanish Hits', 'Curious to every style'
];

export const vibeConfig = {
  'Reggaeton': { icon: Flame, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', gradient: 'from-orange-500 to-red-500' },
  'Funk BR': { icon: Flag, color: 'bg-green-500/20 text-green-400 border-green-500/30', gradient: 'from-green-500 to-yellow-500' },
  'Afrobeat': { icon: Drum, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', gradient: 'from-yellow-500 to-orange-500' },
  'Amapiano': { icon: Music2, color: 'bg-amber-400/20 text-amber-300 border-amber-400/30', gradient: 'from-amber-400 to-yellow-500' },
  'House': { icon: AudioWaveform, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', gradient: 'from-cyan-500 to-blue-500' },
  'Tech House': { icon: Activity, color: 'bg-teal-500/20 text-teal-400 border-teal-500/30', gradient: 'from-teal-500 to-cyan-600' },
  'Afro House': { icon: Globe, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', gradient: 'from-emerald-500 to-teal-600' },
  'Techno': { icon: Zap, color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', gradient: 'from-violet-500 to-purple-600' },
  'EDM': { icon: Radio, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', gradient: 'from-blue-500 to-indigo-500' },
  'Mainstream': { icon: Star, color: 'bg-sky-400/20 text-sky-300 border-sky-400/30', gradient: 'from-sky-400 to-blue-500' },
  'Pop': { icon: Heart, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', gradient: 'from-pink-500 to-rose-500' },
  'Hip-Hop': { icon: Mic, color: 'bg-red-500/20 text-red-400 border-red-500/30', gradient: 'from-red-500 to-orange-600' },
  'R&B': { icon: Mic2, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', gradient: 'from-rose-500 to-pink-600' },
  'Trap': { icon: Diamond, color: 'bg-red-600/20 text-red-400 border-red-600/30', gradient: 'from-red-600 to-rose-700' },
  'Latin': { icon: Flame, color: 'bg-orange-400/20 text-orange-300 border-orange-400/30', gradient: 'from-orange-400 to-red-500' },
  'Salsa': { icon: Music, color: 'bg-red-400/20 text-red-300 border-red-400/30', gradient: 'from-red-400 to-orange-500' },
  'Bachata': { icon: Music2, color: 'bg-purple-400/20 text-purple-300 border-purple-400/30', gradient: 'from-purple-400 to-pink-500' },
  'Dembow': { icon: Drum, color: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30', gradient: 'from-yellow-400 to-orange-400' },
  'Dancehall': { icon: Waves, color: 'bg-green-400/20 text-green-300 border-green-400/30', gradient: 'from-green-400 to-teal-500' },
  'Drill': { icon: Volume2, color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', gradient: 'from-gray-500 to-zinc-600' },
  'Indie': { icon: Guitar, color: 'bg-lime-500/20 text-lime-400 border-lime-500/30', gradient: 'from-lime-500 to-green-500' },
  'Rock': { icon: Guitar, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', gradient: 'from-slate-500 to-zinc-600' },
  'Alternative': { icon: Wind, color: 'bg-stone-400/20 text-stone-300 border-stone-400/30', gradient: 'from-stone-400 to-slate-500' },
  'K-pop': { icon: Star, color: 'bg-fuchsia-400/20 text-fuchsia-300 border-fuchsia-400/30', gradient: 'from-fuchsia-400 to-pink-500' },
  'Deep House': { icon: Moon, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', gradient: 'from-indigo-500 to-blue-600' },
  'Hard Techno': { icon: Zap, color: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30', gradient: 'from-fuchsia-500 to-purple-600' },
  'DnB': { icon: Activity, color: 'bg-orange-600/20 text-orange-400 border-orange-600/30', gradient: 'from-orange-600 to-red-600' },
  'UK Garage': { icon: Headphones, color: 'bg-blue-400/20 text-blue-300 border-blue-400/30', gradient: 'from-blue-400 to-indigo-500' },
  'Throwbacks': { icon: Disc3, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', gradient: 'from-amber-400 to-pink-500' },
  'Portuguese Hits': { icon: Sun, color: 'bg-green-600/20 text-green-400 border-green-600/30', gradient: 'from-green-600 to-yellow-500' },
  'Spanish Hits': { icon: Flame, color: 'bg-red-500/20 text-red-400 border-red-500/30', gradient: 'from-red-500 to-yellow-500' },
  'Curious to every style': { icon: Sparkles, color: 'bg-gradient-to-r from-[#00c6d2]/20 to-[#542b9b]/20 text-[#00c6d2] border-[#00c6d2]/30', gradient: 'from-[#00c6d2] to-[#542b9b]' },
  // Legacy aliases
  'Afrobeats': { icon: Drum, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', gradient: 'from-yellow-500 to-orange-500' },
  'Brazilian Funk': { icon: Flag, color: 'bg-green-500/20 text-green-400 border-green-500/30', gradient: 'from-green-500 to-yellow-500' },
};

const defaultConfig = {
  icon: Music,
  color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  gradient: 'from-gray-500 to-gray-600'
};

export default function VibeTag({ vibe, size = 'md', interactive = false, selected = false, onClick }) {
  const config = vibeConfig[vibe] || defaultConfig;
  const Icon = config.icon;

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-3 py-2 text-sm'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  const Tag = interactive ? motion.button : 'span';
  const motionProps = interactive ? { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } : {};

  return (
    <Tag
      {...motionProps}
      onClick={onClick}
      className={`
        ${sizes[size]} 
        rounded-full 
        font-medium 
        flex items-center gap-1.5 
        border 
        transition-all duration-300
        ${selected 
          ? `bg-gradient-to-r ${config.gradient} text-white border-transparent shadow-lg` 
          : config.color
        }
        ${interactive ? 'cursor-pointer hover:shadow-md' : ''}
      `}
    >
      <Icon className={iconSizes[size]} />
      <span>{vibe}</span>
    </Tag>
  );
}
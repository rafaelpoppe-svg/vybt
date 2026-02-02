import React from 'react';
import { motion } from 'framer-motion';
import { 
  Disc3, Music, Radio, Zap, Flame, Drum, 
  Sparkles, Guitar, PartyPopper, Heart, AudioWaveform
} from 'lucide-react';

export const vibeConfig = {
  'Techno': { 
    icon: Zap, 
    color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    gradient: 'from-violet-500 to-purple-600'
  },
  'Reggaeton': { 
    icon: Flame, 
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    gradient: 'from-orange-500 to-red-500'
  },
  'Pop': { 
    icon: Heart, 
    color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    gradient: 'from-pink-500 to-rose-500'
  },
  'House': { 
    icon: AudioWaveform, 
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    gradient: 'from-cyan-500 to-blue-500'
  },
  'Trap': { 
    icon: Drum, 
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    gradient: 'from-red-500 to-rose-600'
  },
  'Afrobeats': { 
    icon: Drum, 
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    gradient: 'from-yellow-500 to-orange-500'
  },
  'Brazilian Funk': { 
    icon: PartyPopper, 
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    gradient: 'from-green-500 to-emerald-500'
  },
  'Hard Techno': { 
    icon: Zap, 
    color: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
    gradient: 'from-fuchsia-500 to-purple-600'
  },
  '80s Songs': { 
    icon: Disc3, 
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    gradient: 'from-amber-400 to-pink-500'
  },
  'EDM': { 
    icon: Radio, 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    gradient: 'from-blue-500 to-indigo-500'
  },
  'Rock': { 
    icon: Guitar, 
    color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    gradient: 'from-slate-500 to-zinc-600'
  },
  'Disco': { 
    icon: Disc3, 
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    gradient: 'from-purple-500 to-pink-500'
  },
  'Curious to every style': { 
    icon: Sparkles, 
    color: 'bg-gradient-to-r from-[#00fea3]/20 to-[#542b9b]/20 text-[#00fea3] border-[#00fea3]/30',
    gradient: 'from-[#00fea3] to-[#542b9b]'
  }
};

// Default config for unknown vibes
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
    lg: 'px-4 py-2 text-sm'
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
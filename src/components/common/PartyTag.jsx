import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, Moon, Zap, Wine, Crown, Home, GraduationCap, 
  Radio, Music2, Drum, Flame, Mic2, Waves
} from 'lucide-react';

export const partyTagConfig = {
  'Rooftop Afternoon': { 
    icon: Sun, 
    color: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
    gradient: 'from-amber-400 to-orange-400'
  },
  'Rooftop Night': { 
    icon: Moon, 
    color: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30',
    gradient: 'from-indigo-400 to-purple-500'
  },
  'Techno': { 
    icon: Zap, 
    color: 'bg-lime-400/20 text-lime-300 border-lime-400/30',
    gradient: 'from-lime-400 to-green-500'
  },
  'Bar': { 
    icon: Wine, 
    color: 'bg-rose-400/20 text-rose-300 border-rose-400/30',
    gradient: 'from-rose-400 to-pink-500'
  },
  'Luxury': { 
    icon: Crown, 
    color: 'bg-yellow-300/20 text-yellow-200 border-yellow-300/30',
    gradient: 'from-yellow-300 to-amber-400'
  },
  'House Party': { 
    icon: Home, 
    color: 'bg-teal-400/20 text-teal-300 border-teal-400/30',
    gradient: 'from-teal-400 to-cyan-500'
  },
  'University': { 
    icon: GraduationCap, 
    color: 'bg-sky-400/20 text-sky-300 border-sky-400/30',
    gradient: 'from-sky-400 to-blue-500'
  },
  'Commercial': { 
    icon: Radio, 
    color: 'bg-fuchsia-400/20 text-fuchsia-300 border-fuchsia-400/30',
    gradient: 'from-fuchsia-400 to-pink-500'
  },
  'EDM': { 
    icon: Music2, 
    color: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
    gradient: 'from-cyan-400 to-blue-500'
  },
  'Latin': { 
    icon: Drum, 
    color: 'bg-red-400/20 text-red-300 border-red-400/30',
    gradient: 'from-red-400 to-orange-500'
  },
  'Beach Club': { 
    icon: Sun, 
    color: 'bg-blue-300/20 text-blue-200 border-blue-300/30',
    gradient: 'from-blue-300 to-cyan-400'
  },
  'Club': { 
    icon: Music2, 
    color: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
    gradient: 'from-purple-400 to-indigo-500'
  },
  'Festival': { 
    icon: Flame, 
    color: 'bg-orange-400/20 text-orange-300 border-orange-400/30',
    gradient: 'from-orange-400 to-red-500'
  },
  'Karaoke': { 
    icon: Mic2, 
    color: 'bg-pink-400/20 text-pink-300 border-pink-400/30',
    gradient: 'from-pink-400 to-rose-500'
  },
  'Pool Party': { 
    icon: Waves, 
    color: 'bg-cyan-300/20 text-cyan-200 border-cyan-300/30',
    gradient: 'from-cyan-300 to-blue-400'
  }
};

const defaultConfig = {
  icon: Flame,
  color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  gradient: 'from-gray-500 to-gray-600'
};

export default function PartyTag({ tag, size = 'md', interactive = false, selected = false, onClick }) {
  const config = partyTagConfig[tag] || defaultConfig;
  const Icon = config.icon;

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const iconSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
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
      <span>{tag}</span>
    </Tag>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Music2, Wine, Beer, Home, Building2, Waves, Anchor, 
  Flame, Zap, Headphones, Mic2, Globe, GraduationCap, 
  Cake, Sparkle, HeartPulse, Sunrise, GlassWater, Moon, Crown,
  Sun, Wind, Mic, UtensilsCrossed, ChefHat, Drum,
  Coffee, Umbrella, Joystick, Dumbbell
} from 'lucide-react';

export const ALL_PARTY_TYPES = [
  'Nightclub',
  'Bar Crawl',
  'House Party',
  'Rooftop Party',
  'Pool Party',
  'Boat Party',
  'Festival',
  'Rave',
  'DJ Session',
  'Silent Disco',
  'Live Music',
  'Erasmus Party',
  'Student Party',
  'Birthday Party',
  'Themed Party',
  'After Party',
  'Pre-Drinks',
  'Chill Night',
  'VIP Night Out',
  'Beach Club',
  'Open Air Party',
  'Karaoke Night',
  'BBQ Party',
  'Dinner Party',
  'Baile Funk',
  'Flirt Night',
  'Coffee Night',
  'Beach Camp',
  'City Walk',
  'Arcade Night',
  'Pool Session',
  'Beach Session',
];

export const partyTagConfig = {
  'Nightclub': {
    icon: Music2,
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    gradient: 'from-purple-500 to-indigo-600'
  },
  'Bar Crawl': {
    icon: Beer,
    color: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
    gradient: 'from-amber-400 to-orange-500'
  },
  'House Party': {
    icon: Home,
    color: 'bg-teal-400/20 text-teal-300 border-teal-400/30',
    gradient: 'from-teal-400 to-cyan-500'
  },
  'Rooftop Party': {
    icon: Building2,
    color: 'bg-sky-400/20 text-sky-300 border-sky-400/30',
    gradient: 'from-sky-400 to-blue-500'
  },
  'Pool Party': {
    icon: Waves,
    color: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
    gradient: 'from-cyan-400 to-blue-400'
  },
  'Boat Party': {
    icon: Anchor,
    color: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    gradient: 'from-blue-400 to-indigo-500'
  },
  'Festival': {
    icon: Flame,
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    gradient: 'from-orange-500 to-red-600'
  },
  'Rave': {
    icon: Zap,
    color: 'bg-lime-400/20 text-lime-300 border-lime-400/30',
    gradient: 'from-lime-400 to-green-500'
  },
  'DJ Session': {
    icon: Headphones,
    color: 'bg-violet-400/20 text-violet-300 border-violet-400/30',
    gradient: 'from-violet-400 to-purple-600'
  },
  'Silent Disco': {
    icon: Headphones,
    color: 'bg-fuchsia-400/20 text-fuchsia-300 border-fuchsia-400/30',
    gradient: 'from-fuchsia-400 to-pink-500'
  },
  'Live Music': {
    icon: Mic2,
    color: 'bg-rose-400/20 text-rose-300 border-rose-400/30',
    gradient: 'from-rose-400 to-pink-500'
  },
  'Erasmus Party': {
    icon: Globe,
    color: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
    gradient: 'from-emerald-400 to-teal-500'
  },
  'Student Party': {
    icon: GraduationCap,
    color: 'bg-sky-300/20 text-sky-200 border-sky-300/30',
    gradient: 'from-sky-300 to-blue-400'
  },
  'Birthday Party': {
    icon: Cake,
    color: 'bg-pink-400/20 text-pink-300 border-pink-400/30',
    gradient: 'from-pink-400 to-rose-500'
  },
  'Themed Party': {
    icon: Sparkles,
    color: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
    gradient: 'from-yellow-400 to-amber-500'
  },
  'After Party': {
    icon: Sunrise,
    color: 'bg-orange-300/20 text-orange-200 border-orange-300/30',
    gradient: 'from-orange-300 to-pink-400'
  },
  'Pre-Drinks': {
    icon: GlassWater,
    color: 'bg-blue-300/20 text-blue-200 border-blue-300/30',
    gradient: 'from-blue-300 to-cyan-400'
  },
  'Chill Night': {
    icon: Moon,
    color: 'bg-indigo-300/20 text-indigo-200 border-indigo-300/30',
    gradient: 'from-indigo-300 to-purple-400'
  },
  'VIP Night Out': {
    icon: Crown,
    color: 'bg-yellow-300/20 text-yellow-200 border-yellow-300/30',
    gradient: 'from-yellow-300 to-amber-400'
  },
  'Beach Club': {
    icon: Sun,
    color: 'bg-amber-300/20 text-amber-200 border-amber-300/30',
    gradient: 'from-amber-300 to-orange-400'
  },
  'Open Air Party': {
    icon: Wind,
    color: 'bg-green-400/20 text-green-300 border-green-400/30',
    gradient: 'from-green-400 to-emerald-500'
  },
  'Karaoke Night': {
    icon: Mic,
    color: 'bg-pink-300/20 text-pink-200 border-pink-300/30',
    gradient: 'from-pink-300 to-rose-400'
  },
  'BBQ Party': {
    icon: UtensilsCrossed,
    color: 'bg-red-400/20 text-red-300 border-red-400/30',
    gradient: 'from-red-400 to-orange-500'
  },
  'Dinner Party': {
    icon: ChefHat,
    color: 'bg-stone-400/20 text-stone-300 border-stone-400/30',
    gradient: 'from-stone-400 to-amber-500'
  },
  'Baile Funk': {
    icon: Drum,
    color: 'bg-green-500/20 text-green-300 border-green-500/30',
    gradient: 'from-green-500 to-yellow-500'
  },
  'Flirt Night': {
    icon: HeartPulse,
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    gradient: 'from-rose-500 to-pink-600'
  },
  'Coffee Night': {
    icon: Coffee,
    color: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
    gradient: 'from-amber-600 to-yellow-600'
  },
  'Beach Camp': {
    icon: Umbrella,
    color: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    gradient: 'from-sky-500 to-cyan-400'
  },
  'City Walk': {
    icon: Wind,
    color: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
    gradient: 'from-slate-400 to-gray-500'
  },
  'Arcade Night': {
    icon: Joystick,
    color: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    gradient: 'from-violet-500 to-indigo-500'
  },
  'Pool Session': {
    icon: Dumbbell,
    color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    gradient: 'from-cyan-500 to-blue-500'
  },
  'Beach Session': {
    icon: Waves,
    color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    gradient: 'from-teal-500 to-emerald-500'
  },
  // Legacy aliases (for existing data)
  'Bar Hopping': {
    icon: Beer,
    color: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
    gradient: 'from-amber-400 to-orange-500'
  },
  'Pub Crawl': {
    icon: Wine,
    color: 'bg-orange-400/20 text-orange-300 border-orange-400/30',
    gradient: 'from-orange-400 to-red-500'
  },
  'DJ Set': {
    icon: Headphones,
    color: 'bg-violet-400/20 text-violet-300 border-violet-400/30',
    gradient: 'from-violet-400 to-purple-600'
  },
  'Social Mixer': {
    icon: Globe,
    color: 'bg-fuchsia-400/20 text-fuchsia-300 border-fuchsia-400/30',
    gradient: 'from-fuchsia-400 to-pink-500'
  },
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
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
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
      <span>{tag}</span>
    </Tag>
  );
}
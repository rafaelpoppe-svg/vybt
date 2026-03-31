import React from 'react';
import { motion } from 'framer-motion';
import { 
  Moon, Wind, Zap, Flame, Activity, Sparkles,
  Heart, Eye, Compass, Music2, Coffee, Crown,
  AlertTriangle, Music, Waves, Building2, Star
} from 'lucide-react';

// Grouped for display purposes
export const VIBE_GROUPS = {
  'Energy Level': ['Late Night', 'Chill', 'Balanced', 'Hype', 'Wild', 'Intense'],
  'Your Style': ['Flirty', 'Observer', 'Explorer', 'Party Starter', 'Lowkey', 'VIP Energy', 'Chaos Mode'],
  'Mood': ['Festival Mood', 'Beach Vibes', 'City Night', 'Rooftop Energy'],
};

export const ALL_VIBES = [
  // Energy Level
  'Late Night', 'Chill', 'Balanced', 'Hype', 'Wild', 'Intense',
  // Your Style
  'Flirty', 'Observer', 'Explorer', 'Party Starter', 'Lowkey', 'VIP Energy', 'Chaos Mode',
  // Mood
  'Festival Mood', 'Beach Vibes', 'City Night', 'Rooftop Energy',
];

export const vibeConfig = {
  // Energy Level
  'Late Night':     { icon: Moon,          color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',   gradient: 'from-indigo-500 to-blue-600' },
  'Chill':          { icon: Coffee,         color: 'bg-sky-400/20 text-sky-300 border-sky-400/30',            gradient: 'from-sky-400 to-blue-400' },
  'Balanced':       { icon: Activity,       color: 'bg-teal-400/20 text-teal-300 border-teal-400/30',         gradient: 'from-teal-400 to-cyan-500' },
  'Hype':           { icon: Zap,            color: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',   gradient: 'from-yellow-400 to-orange-500' },
  'Wild':           { icon: Flame,          color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',   gradient: 'from-orange-500 to-red-600' },
  'Intense':        { icon: AlertTriangle,  color: 'bg-red-500/20 text-red-400 border-red-500/30',            gradient: 'from-red-500 to-rose-700' },

  // Your Style
  'Flirty':         { icon: Heart,          color: 'bg-rose-400/20 text-rose-300 border-rose-400/30',         gradient: 'from-rose-400 to-pink-600' },
  'Observer':       { icon: Eye,            color: 'bg-slate-400/20 text-slate-300 border-slate-400/30',      gradient: 'from-slate-400 to-gray-600' },
  'Explorer':       { icon: Compass,        color: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',gradient: 'from-emerald-400 to-teal-500' },
  'Party Starter':  { icon: Music2,         color: 'bg-fuchsia-400/20 text-fuchsia-300 border-fuchsia-400/30',gradient: 'from-fuchsia-400 to-purple-600' },
  'Lowkey':         { icon: Wind,           color: 'bg-stone-400/20 text-stone-300 border-stone-400/30',      gradient: 'from-stone-400 to-slate-500' },
  'VIP Energy':     { icon: Crown,          color: 'bg-amber-400/20 text-amber-300 border-amber-400/30',      gradient: 'from-amber-400 to-yellow-500' },
  'Chaos Mode':     { icon: AlertTriangle,  color: 'bg-lime-400/20 text-lime-300 border-lime-400/30',         gradient: 'from-lime-400 to-green-600' },

  // Mood
  'Festival Mood':  { icon: Sparkles,       color: 'bg-violet-400/20 text-violet-300 border-violet-400/30',   gradient: 'from-violet-400 to-purple-600' },
  'Beach Vibes':    { icon: Waves,          color: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',         gradient: 'from-cyan-400 to-blue-500' },
  'City Night':     { icon: Building2,      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',         gradient: 'from-blue-500 to-indigo-600' },
  'Rooftop Energy': { icon: Star,           color: 'bg-pink-400/20 text-pink-300 border-pink-400/30',         gradient: 'from-pink-400 to-rose-500' },

  // Legacy aliases (for existing user data)
  'Reggaeton':      { icon: Flame,          color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',   gradient: 'from-orange-500 to-red-500' },
  'Funk BR':        { icon: Music2,         color: 'bg-green-500/20 text-green-400 border-green-500/30',      gradient: 'from-green-500 to-yellow-500' },
  'Afrobeat':       { icon: Music,          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',   gradient: 'from-yellow-500 to-orange-500' },
  'House':          { icon: Activity,       color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',         gradient: 'from-cyan-500 to-blue-500' },
  'Techno':         { icon: Zap,            color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',   gradient: 'from-violet-500 to-purple-600' },
  'Pop':            { icon: Heart,          color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',         gradient: 'from-pink-500 to-rose-500' },
  'Hip-Hop':        { icon: Music,          color: 'bg-red-500/20 text-red-400 border-red-500/30',            gradient: 'from-red-500 to-orange-600' },
  'R&B':            { icon: Music2,         color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',         gradient: 'from-rose-500 to-pink-600' },
  'Latin':          { icon: Flame,          color: 'bg-orange-400/20 text-orange-300 border-orange-400/30',   gradient: 'from-orange-400 to-red-500' },
  'EDM':            { icon: Zap,            color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',         gradient: 'from-blue-500 to-indigo-500' },
  'Deep House':     { icon: Moon,           color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',   gradient: 'from-indigo-500 to-blue-600' },
};

const defaultConfig = {
  icon: Music,
  color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  gradient: 'from-gray-500 to-gray-600'
};

export default function VibeTag({ vibe, size = 'md', interactive = false, selected = false, onClick }) {
  const config = vibeConfig[vibe] || defaultConfig;
  const Icon = config.icon;
  const isDark = !document.documentElement.classList.contains('light');

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

  // In light mode, unselected badges get stronger opacity + dark text
  const unselectedClass = isDark
    ? config.color
    : config.color
        .replace(/\/20/g, '/40')
        .replace(/\/30/g, '/60')
        .replace('text-', 'text-opacity-100 text-')
        .split(' ')
        .map(c => c.startsWith('text-') && !c.includes('opacity') ? 'text-gray-900' : c)
        .join(' ');

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
          ? `bg-gradient-to-r ${config.gradient} border-transparent shadow-lg ${isDark ? 'text-white' : 'text-gray-900'}`
          : isDark ? config.color : config.color.replace(/\/20/g, '/35').replace(/\/30/g, '/50')
        }
        ${!selected && !isDark ? '!text-gray-900 font-semibold' : ''}
        ${interactive ? 'cursor-pointer hover:shadow-md' : ''}
      `}
    >
      <Icon className={iconSizes[size]} />
      <span>{vibe}</span>
    </Tag>
  );
}
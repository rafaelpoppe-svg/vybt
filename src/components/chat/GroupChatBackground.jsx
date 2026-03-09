import React, { useMemo } from 'react';

export const GROUP_CHAT_THEMES = {
  default: {
    name: 'Default',
    emoji: null,
    bgColor: 'transparent',
    previewColor: '#0b0b0b',
    previewAccent: '#1a1a1a',
  },
  fuego: {
    name: 'Fuego',
    emoji: '🔥',
    bgColor: 'rgba(180, 20, 0, 0.18)',
    previewColor: '#5c0000',
    previewAccent: '#b41400',
  },
  rave: {
    name: 'Rave',
    emoji: '⚡',
    bgColor: 'rgba(100, 0, 200, 0.18)',
    previewColor: '#1a0040',
    previewAccent: '#6400c8',
  },
  vip: {
    name: 'VIP',
    emoji: '💎',
    bgColor: 'rgba(180, 140, 0, 0.15)',
    previewColor: '#1a1400',
    previewAccent: '#b48c00',
  },
  tropical: {
    name: 'Tropical',
    emoji: '🌴',
    bgColor: 'rgba(0, 140, 80, 0.18)',
    previewColor: '#001a0a',
    previewAccent: '#008c50',
  },
  neon: {
    name: 'Neon',
    emoji: '🎵',
    bgColor: 'rgba(0, 254, 163, 0.10)',
    previewColor: '#002218',
    previewAccent: '#00c6d2',
  },
  champagne: {
    name: 'Champagne',
    emoji: '🥂',
    bgColor: 'rgba(200, 170, 80, 0.14)',
    previewColor: '#1c1500',
    previewAccent: '#c8aa50',
  },
  street: {
    name: 'Street',
    emoji: '🎤',
    bgColor: 'rgba(80, 80, 100, 0.20)',
    previewColor: '#111118',
    previewAccent: '#505064',
  },
};

// Deterministic pseudo-random positions based on index
const POSITIONS = [
  { top: '4%', left: '3%', size: '1.4rem', rotate: '-15deg', opacity: 0.55 },
  { top: '8%', left: '70%', size: '1.1rem', rotate: '20deg', opacity: 0.45 },
  { top: '2%', left: '88%', size: '1.7rem', rotate: '-5deg', opacity: 0.5 },
  { top: '15%', left: '45%', size: '0.9rem', rotate: '30deg', opacity: 0.35 },
  { top: '20%', left: '15%', size: '1.5rem', rotate: '10deg', opacity: 0.5 },
  { top: '25%', left: '80%', size: '1.2rem', rotate: '-25deg', opacity: 0.4 },
  { top: '30%', left: '55%', size: '1.6rem', rotate: '8deg', opacity: 0.45 },
  { top: '35%', left: '5%', size: '1.0rem', rotate: '-12deg', opacity: 0.35 },
  { top: '40%', left: '35%', size: '1.3rem', rotate: '22deg', opacity: 0.4 },
  { top: '42%', left: '90%', size: '1.1rem', rotate: '-18deg', opacity: 0.45 },
  { top: '50%', left: '60%', size: '1.5rem', rotate: '14deg', opacity: 0.4 },
  { top: '55%', left: '18%', size: '1.2rem', rotate: '-8deg', opacity: 0.5 },
  { top: '60%', left: '75%', size: '1.4rem', rotate: '25deg', opacity: 0.38 },
  { top: '65%', left: '42%', size: '1.0rem', rotate: '-20deg', opacity: 0.42 },
  { top: '68%', left: '8%', size: '1.6rem', rotate: '5deg', opacity: 0.44 },
  { top: '72%', left: '85%', size: '1.1rem', rotate: '-30deg', opacity: 0.36 },
  { top: '75%', left: '30%', size: '1.3rem', rotate: '18deg', opacity: 0.48 },
  { top: '80%', left: '62%', size: '1.2rem', rotate: '-10deg', opacity: 0.4 },
  { top: '85%', left: '50%', size: '0.9rem', rotate: '28deg', opacity: 0.32 },
  { top: '88%', left: '12%', size: '1.5rem', rotate: '-22deg', opacity: 0.5 },
  { top: '92%', left: '80%', size: '1.0rem', rotate: '12deg', opacity: 0.35 },
  { top: '95%', left: '38%', size: '1.4rem', rotate: '-7deg', opacity: 0.42 },
  { top: '12%', left: '28%', size: '1.1rem', rotate: '35deg', opacity: 0.38 },
  { top: '47%', left: '0%', size: '1.3rem', rotate: '-16deg', opacity: 0.42 },
];

export default function GroupChatBackground({ theme }) {
  const config = GROUP_CHAT_THEMES[theme] || GROUP_CHAT_THEMES.default;

  if (!config.emoji) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ backgroundColor: config.bgColor }}
    >
      {POSITIONS.map((pos, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            fontSize: pos.size,
            opacity: pos.opacity,
            transform: `rotate(${pos.rotate})`,
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          {config.emoji}
        </span>
      ))}
    </div>
  );
}
import React from 'react';
import VibeTag from '../common/VibeTag';

const vibeOptions = [
  'Techno', 'Reggaeton', 'Pop', 'House', 'Trap', 
  'Afrobeats', 'Brazilian Funk', 'Hard Techno', 
  '80s Songs', 'EDM', 'Rock', 'Disco', 
  'Curious to every style'
];

export default function VibesSelect({ selected = [], onSelect, min = 2, max = 5 }) {
  const toggleVibe = (vibe) => {
    if (selected.includes(vibe)) {
      onSelect(selected.filter(v => v !== vibe));
    } else if (selected.length < max) {
      onSelect([...selected, vibe]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">What's your vibe?</h2>
        <p className="text-gray-400 text-sm">Select {min}-{max} music styles you love</p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {vibeOptions.map((vibe) => (
          <VibeTag
            key={vibe}
            vibe={vibe}
            size="lg"
            interactive
            selected={selected.includes(vibe)}
            onClick={() => toggleVibe(vibe)}
          />
        ))}
      </div>

      <div className="text-center">
        <span className={`text-sm ${
          selected.length >= min ? 'text-[#00fea3]' : 'text-gray-500'
        }`}>
          {selected.length}/{max} selected
        </span>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import VibeTag, { ALL_VIBES } from '../common/VibeTag';
import { useLanguage } from '../common/LanguageContext';

export default function VibesSelect({ selected = [], onSelect, min = 2, max = 5 }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const filtered = ALL_VIBES.filter(v => v.toLowerCase().includes(search.toLowerCase()));

  const toggleVibe = (vibe) => {
    if (selected.includes(vibe)) {
      onSelect(selected.filter(v => v !== vibe));
    } else if (selected.length < max) {
      onSelect([...selected, vibe]);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">What's your vibe?</h2>
        <p className="text-gray-400 text-sm">Select {min}–{max} music styles you love</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vibes..."
          className="w-full pl-9 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00fea3]"
        />
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{filtered.length} vibes</span>
        <span className={`text-sm font-semibold ${selected.length >= min ? 'text-[#00fea3]' : 'text-gray-500'}`}>
          {selected.length}/{max} selected
        </span>
      </div>

      {/* Grid */}
      <div className="flex flex-wrap gap-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-hide">
        {filtered.map((vibe) => {
          const isDisabled = !selected.includes(vibe) && selected.length >= max;
          return (
            <div key={vibe} className={isDisabled ? 'opacity-40' : ''}>
              <VibeTag
                vibe={vibe}
                size="md"
                interactive={!isDisabled}
                selected={selected.includes(vibe)}
                onClick={() => !isDisabled && toggleVibe(vibe)}
              />
            </div>
          );
        })}
      </div>

      {selected.length >= max && (
        <p className="text-center text-xs text-[#00fea3]/70">
          Limit reached — deselect one to pick another
        </p>
      )}
    </div>
  );
}
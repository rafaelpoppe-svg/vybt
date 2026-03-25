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
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t.whatsYourVibe}</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{(t.vibeSubtitle || '').replace('{min}', min).replace('{max}', max)}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchVibes}
          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#00fea3] border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{filtered.length} {t.vibesCount}</span>
        <span className={`text-sm font-semibold ${selected.length >= min ? 'text-[#00fea3]' : ''}`} style={selected.length < min ? { color: 'var(--text-muted)' } : {}}>
          {selected.length}/{max} {t.selected}
        </span>
      </div>

      {/* Grid */}
      <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-hide">
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
          {t.limitReached}
        </p>
      )}
    </div>
  );
}
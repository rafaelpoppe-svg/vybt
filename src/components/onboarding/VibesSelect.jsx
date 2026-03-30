import React from 'react';
import VibeTag, { VIBE_GROUPS } from '../common/VibeTag';
import { useLanguage } from '../common/LanguageContext';

export default function VibesSelect({ selected = [], onSelect, min = 2, max = 5 }) {
  const { t } = useLanguage();

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

      <div className="flex items-center justify-end">
        <span className={`text-sm font-semibold ${selected.length >= min ? 'text-[#00fea3]' : ''}`} style={selected.length < min ? { color: 'var(--text-muted)' } : {}}>
          {selected.length}/{max} {t.selected}
        </span>
      </div>

      <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1 scrollbar-hide">
        {Object.entries(VIBE_GROUPS).map(([groupName, vibes]) => (
          <div key={groupName}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              {groupName}
            </p>
            <div className="flex flex-wrap gap-2">
              {vibes.map((vibe) => {
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
          </div>
        ))}
      </div>

      {selected.length >= max && (
        <p className="text-center text-xs text-[#00fea3]/70">
          {t.limitReached}
        </p>
      )}
    </div>
  );
}
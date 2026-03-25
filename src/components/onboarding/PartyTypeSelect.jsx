import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Search, Flame } from 'lucide-react';
import { ALL_PARTY_TYPES, partyTagConfig } from '../common/PartyTag';
import { useLanguage } from '../common/LanguageContext';

export default function PartyTypeSelect({ selected = [], onSelect, min = 2, max = 5 }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const filtered = ALL_PARTY_TYPES.filter(type =>
    type.toLowerCase().includes(search.toLowerCase())
  );

  const toggleType = (type) => {
    if (selected.includes(type)) {
      onSelect(selected.filter(t => t !== type));
    } else if (selected.length < max) {
      onSelect([...selected, type]);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t.whatPartiesDoYouLove}</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{(t.partySubtitle || '').replace('{min}', min).replace('{max}', max)}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPartyTypes}
          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#00fea3] border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{filtered.length} {t.typesCount}</span>
        <span className={`text-sm font-semibold ${selected.length >= min ? 'text-[#00fea3]' : ''}`} style={selected.length < min ? { color: 'var(--text-muted)' } : {}}>
          {selected.length}/{max} {t.selected}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-hide">
        {filtered.map((type) => {
          const isSelected = selected.includes(type);
          const config = partyTagConfig[type] || { icon: Flame, gradient: 'from-gray-500 to-gray-600' };
          const Icon = config.icon;
          const isDisabled = !isSelected && selected.length >= max;

          return (
            <motion.button
              key={type}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleType(type)}
              disabled={isDisabled}
              className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-2.5 text-left ${
                isSelected ? 'border-[#00fea3] bg-[#00fea3]/10' : isDisabled ? 'opacity-40' : ''
              }`}
              style={!isSelected ? { borderColor: 'var(--border)', background: 'var(--surface)' } : {}}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-[#00fea3]' : ''}`} style={!isSelected ? { color: 'var(--text-muted)' } : {}} />
              <span className={`font-medium text-xs leading-tight flex-1 ${isSelected ? 'text-[#00fea3]' : ''}`} style={!isSelected ? { color: 'var(--text-primary)' } : {}}>
                {type}
              </span>
              {isSelected && <Check className="w-3.5 h-3.5 text-[#00fea3] flex-shrink-0" />}
            </motion.button>
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
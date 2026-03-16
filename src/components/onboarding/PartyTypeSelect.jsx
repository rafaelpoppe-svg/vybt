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
        <h2 className="text-2xl font-bold text-white mb-1">{t.whatPartiesDoYouLove}</h2>
        <p className="text-gray-400 text-sm">{(t.partySubtitle || '').replace('{min}', min).replace('{max}', max)}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPartyTypes}
          className="w-full pl-9 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00fea3]"
        />
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{filtered.length} {t.typesCount}</span>
        <span className={`text-sm font-semibold ${selected.length >= min ? 'text-[#00fea3]' : 'text-gray-500'}`}>
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
                isSelected
                  ? 'border-[#00fea3] bg-[#00fea3]/10'
                  : isDisabled
                  ? 'border-gray-800 bg-gray-900/30 opacity-40'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600 active:bg-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-[#00fea3]' : 'text-gray-400'}`} />
              <span className={`font-medium text-xs leading-tight flex-1 ${isSelected ? 'text-[#00fea3]' : 'text-white'}`}>
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
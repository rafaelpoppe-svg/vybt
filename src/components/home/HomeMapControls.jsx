import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useLanguage } from '../common/LanguageContext';

export default function HomeMapControls({ activeSort, setActiveSort, onFilterClick, hasActiveFilters }) {
  const {t} = useLanguage();
  const SORT_TABS = [
    { id: 'foryou',   label: t.forYou,   emoji: '✨', activeColor: 'bg-gradient-to-r from-[#00c6d2] to-[#7c3aed]', activeText: 'text-white' },
    { id: 'myplans',  label: t.myPlans,  emoji: '🗓️', activeColor: 'bg-gradient-to-r from-[#542b9b] to-[#00c6d2]', activeText: 'text-white' },
  ];
  
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-between mb-3 px-4">
      {/* Sort tabs */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
        {SORT_TABS.map(tab => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => setActiveSort(tab.id)}
            className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
              activeSort === tab.id
                ? `${tab.activeColor} ${tab.activeText} shadow-md`
                : 'text-gray-500'
            }`}
          >
            <span className="text-xs">{tab.emoji}</span>
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Right: date/time + filter */}
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-white font-black text-sm leading-none">{format(now, 'HH:mm')}</p>
          <p className="text-gray-500 text-[10px] leading-none mt-0.5">{format(now, 'dd MMM', { locale: pt })}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onFilterClick}
          className={`p-2 rounded-xl transition-all ${hasActiveFilters ? 'bg-[#00fea3]' : 'bg-white/8 border border-white/10'}`}
        >
          <SlidersHorizontal className={`w-4 h-4 ${hasActiveFilters ? 'text-[#0b0b0b]' : 'text-gray-300'}`} />
        </motion.button>
      </div>
    </div>
  );
}
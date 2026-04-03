import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronDown } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

const PARTY_TYPES = ['All', 'Club', 'Bar', 'House Party', 'Pub Crawl', 'Festival', 'Rooftop', 'Beach', 'Erasmus'];


export default function HomeFilterBar({ onFilterChange }) {
  const {t} = useLanguage();
  const TIME_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Now', value: 'now' },
  { label: t.tonight, value: 'tonight' },
  { label: 'Late Night', value: 'late' },
];

  const [activeTime, setActiveTime] = useState('all');
  const [activeType, setActiveType] = useState('All');

  const handleTime = (v) => {
    setActiveTime(v);
    onFilterChange({ time: v, type: activeType });
  };
  const handleType = (v) => {
    setActiveType(v);
    onFilterChange({ time: activeTime, type: v });
  };

  return (
    <div className="space-y-2 px-4">
      {/* Time filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide" data-hscroll="true">
        {TIME_FILTERS.map(f => (
          <motion.button
            key={f.value}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTime(f.value)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeTime === f.value ? '#00c6d2' : 'rgba(255,255,255,0.07)',
              color: activeTime === f.value ? '#0b0b0b' : '#aaa',
              border: activeTime === f.value ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {f.value === 'now' && <motion.div animate={{ opacity: [1,0.3,1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            {f.value === 'tonight' && <Clock className="w-3 h-3" />}
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Party type filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide" data-hscroll="true">
        {PARTY_TYPES.map(type => (
          <motion.button
            key={type}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleType(type)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: activeType === type ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.05)',
              color: activeType === type ? '#c084fc' : '#777',
              border: activeType === type ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {type}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
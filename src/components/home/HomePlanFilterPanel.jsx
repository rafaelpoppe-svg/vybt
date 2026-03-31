import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Search, CalendarDays } from 'lucide-react';
import PartyTag, { ALL_PARTY_TYPES } from '../common/PartyTag';



export default function HomePlanFilterPanel({ isOpen, onClose, filters, setFilters }) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const activeCount = (filters.partyTags?.length || 0) + (filters.startTime ? 1 : 0) + (filters.endTime ? 1 : 0) + (filters.planDate ? 1 : 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mx-4 mb-3 rounded-2xl p-4"
        style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-bold text-sm">Filter Plans</h3>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Date filter */}
        <div className="mb-3">
          <label className="text-gray-400 text-xs mb-2 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.planDate || ''}
              onChange={e => setFilters({ ...filters, planDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00c6d2]"
              style={{ colorScheme: 'dark' }}
            />
            {filters.planDate && (
              <button
                onClick={() => setFilters({ ...filters, planDate: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Time range */}
        <div className="mb-3">
          <label className="text-gray-400 text-xs mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Time range
          </label>
          <div className="flex gap-2">
            <input
              type="time"
              value={filters.startTime || ''}
              onChange={e => setFilters({ ...filters, startTime: e.target.value })}
              className={`flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1.5 text-xs ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            />
            <span className="text-gray-600 self-center text-xs">→</span>
            <input
              type="time"
              value={filters.endTime || ''}
              onChange={e => setFilters({ ...filters, endTime: e.target.value })}
              className={`flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1.5 text-xs ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            />
          </div>
        </div>

        {/* Party tags */}
        <div>
          <label className="text-gray-400 text-xs mb-2 block">Party Type</label>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-7 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#00fea3]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {ALL_PARTY_TYPES.filter(t => t.toLowerCase().includes(search.toLowerCase())).map(tag => (
              <PartyTag
                key={tag}
                tag={tag}
                size="sm"
                interactive
                selected={filters.partyTags?.includes(tag)}
                onClick={() => {
                  const tags = filters.partyTags || [];
                  setFilters({ ...filters, partyTags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag] });
                }}
              />
            ))}
          </div>
        </div>

        {activeCount > 0 && (
          <button
            onClick={() => setFilters({ partyTags: [], startTime: '', endTime: '', planDate: '' })}
            className="w-full mt-3 py-1.5 text-xs text-gray-400 hover:text-white"
          >
            Clear all filters
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
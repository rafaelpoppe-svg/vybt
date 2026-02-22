import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, Flame, Users, Heart, Music, Search } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import VibeTag, { ALL_VIBES } from '../common/VibeTag';
import PartyTag, { ALL_PARTY_TYPES } from '../common/PartyTag';

export function PlanFilters({ isOpen, onClose, filters, setFilters }) {
  const [partySearch, setPartySearch] = useState('');
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 z-50 bg-gray-900 border border-gray-800 rounded-xl p-4 mt-2 max-h-[60vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold">Filter Plans</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Sort By */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-2 block">Sort by</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'foryou', label: 'For You', icon: Heart },
              { id: 'onfire', label: 'On Fire', icon: Flame },
              { id: 'popular', label: 'Most Members', icon: Users }
            ].map(opt => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters({ ...filters, sortBy: opt.id })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                  filters.sortBy === opt.id
                    ? 'bg-[#00fea3] text-[#0b0b0b]'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Start Time
          </label>
          <div className="flex gap-2">
            <input
              type="time"
              value={filters.startTime || ''}
              onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
              className="flex-1 bg-gray-800 border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="time"
              value={filters.endTime || ''}
              onChange={(e) => setFilters({ ...filters, endTime: e.target.value })}
              className="flex-1 bg-gray-800 border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Radius */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            Radius: {filters.radius || 10} km
          </label>
          <Slider
            value={[filters.radius || 10]}
            onValueChange={([val]) => setFilters({ ...filters, radius: val })}
            min={1}
            max={50}
            step={1}
            className="mt-2"
          />
        </div>

        {/* Party Tags */}
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Party Type</label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={partySearch}
              onChange={(e) => setPartySearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00fea3]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_PARTY_TYPES.filter(t => t.toLowerCase().includes(partySearch.toLowerCase())).map(tag => (
              <PartyTag
                key={tag}
                tag={tag}
                size="sm"
                interactive
                selected={filters.partyTags?.includes(tag)}
                onClick={() => {
                  const tags = filters.partyTags || [];
                  setFilters({
                    ...filters,
                    partyTags: tags.includes(tag) 
                      ? tags.filter(t => t !== tag)
                      : [...tags, tag]
                  });
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setFilters({ sortBy: 'foryou' })}
          className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white"
        >
          Clear all filters
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export function UserFilters({ isOpen, onClose, filters, setFilters }) {
  const [vibeSearch, setVibeSearch] = useState('');
  if (!isOpen) return null;

  const ageRanges = ['18-25', '25-30', '25-35'];
  const genders = ['female', 'male', 'other'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 z-50 bg-gray-900 border border-gray-800 rounded-xl p-4 mt-2 max-h-[60vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold">Filter People</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Sort By */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-2 block">Show me</label>
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilters({ ...filters, sortBy: 'foryou' })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                filters.sortBy === 'foryou'
                  ? 'bg-[#00fea3] text-[#0b0b0b]'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Matches my vibes
            </motion.button>
          </div>
        </div>

        {/* Age Range */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-2 block">Age Range</label>
          <div className="flex flex-wrap gap-2">
            {ageRanges.map(age => (
              <motion.button
                key={age}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters({ ...filters, ageRange: filters.ageRange === age ? null : age })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  filters.ageRange === age
                    ? 'bg-[#00fea3] text-[#0b0b0b]'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {age}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-2 block">Gender</label>
          <div className="flex flex-wrap gap-2">
            {genders.map(gender => (
              <motion.button
                key={gender}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters({ ...filters, gender: filters.gender === gender ? null : gender })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${
                  filters.gender === gender
                    ? 'bg-[#00fea3] text-[#0b0b0b]'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {gender}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Vibes */}
        <div>
          <label className="text-gray-400 text-sm mb-2 flex items-center gap-1.5">
            <Music className="w-4 h-4" />
            Similar Vibes
          </label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={vibeSearch}
              onChange={(e) => setVibeSearch(e.target.value)}
              placeholder="Search vibes..."
              className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00fea3]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_VIBES.filter(v => v.toLowerCase().includes(vibeSearch.toLowerCase())).map(vibe => (
              <VibeTag
                key={vibe}
                vibe={vibe}
                size="sm"
                interactive
                selected={filters.vibes?.includes(vibe)}
                onClick={() => {
                  const vibes = filters.vibes || [];
                  setFilters({
                    ...filters,
                    vibes: vibes.includes(vibe) 
                      ? vibes.filter(v => v !== vibe)
                      : [...vibes, vibe]
                  });
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setFilters({ sortBy: 'foryou' })}
          className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white"
        >
          Clear all filters
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
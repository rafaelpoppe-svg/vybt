import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sun, Moon, Music, Wine, Crown, Home, GraduationCap, Building } from 'lucide-react';

const partyTypes = [
  { id: 'rooftop_afternoon', label: 'Rooftop Afternoon', icon: Sun },
  { id: 'rooftop_night', label: 'Rooftop Night', icon: Moon },
  { id: 'techno_parties', label: 'Techno Parties', icon: Music },
  { id: 'simple_bar', label: 'Simple Bar', icon: Wine },
  { id: 'luxury_parties', label: 'Luxury Parties', icon: Crown },
  { id: 'house_parties', label: 'House Parties', icon: Home },
  { id: 'university_parties', label: 'University Parties', icon: GraduationCap },
  { id: 'commercial_parties', label: 'Commercial Parties', icon: Building }
];

export default function PartyTypeSelect({ selected = [], onSelect, min = 2, max = 5 }) {
  const toggleType = (type) => {
    if (selected.includes(type)) {
      onSelect(selected.filter(t => t !== type));
    } else if (selected.length < max) {
      onSelect([...selected, type]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">What parties do you love?</h2>
        <p className="text-gray-400 text-sm">Select {min}-{max} party types</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {partyTypes.map((type) => {
          const isSelected = selected.includes(type.id);
          const Icon = type.icon;
          return (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleType(type.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 ${
                isSelected
                  ? 'border-[#00fea3] bg-[#00fea3]/10'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? 'text-[#00fea3]' : 'text-gray-400'}`} />
              <span className={`font-medium text-sm ${isSelected ? 'text-[#00fea3]' : 'text-white'}`}>
                {type.label}
              </span>
              {isSelected && <Check className="w-4 h-4 text-[#00fea3] ml-auto" />}
            </motion.button>
          );
        })}
      </div>

      <div className="text-center">
        <span className={`text-sm ${selected.length >= min ? 'text-[#00fea3]' : 'text-gray-500'}`}>
          {selected.length}/{max} selected
        </span>
      </div>
    </div>
  );
}
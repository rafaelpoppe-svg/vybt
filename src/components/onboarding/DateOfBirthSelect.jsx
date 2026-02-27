import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '../common/LanguageContext';

export default function DateOfBirthSelect({ value, onChange }) {
  const [error, setError] = useState('');

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    
    if (!selectedDate) {
      setError('');
      onChange('');
      return;
    }

    const age = calculateAge(selectedDate);
    
    if (age < 18) {
      setError('You must be at least 18 years old to use Vybt');
      onChange('');
    } else {
      setError('');
      onChange(selectedDate);
    }
  };

  // Maximum date: 18 years ago from today
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Minimum date: 100 years ago
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#00fea3]/20 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-[#00fea3]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">What's your birthday?</h2>
        <p className="text-gray-400">You must be 18+ to use Vybt</p>
      </div>

      <div className="space-y-4">
        <Input
          type="date"
          value={value}
          onChange={handleDateChange}
          max={maxDateString}
          min={minDateString}
          className="bg-gray-900 border-gray-800 text-white text-lg py-6 text-center"
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {value && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-[#00fea3]/10 border border-[#00fea3]/30"
          >
            <p className="text-[#00fea3] text-sm text-center">
              ✓ Age verified: {calculateAge(value)} years old
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
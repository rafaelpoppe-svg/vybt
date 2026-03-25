import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AtSign, Check, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function UsernameSelect({ value, onChange }) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null); // null | true | false

  const sanitize = (v) => v.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 24);

  const handleChange = (raw) => {
    const sanitized = sanitize(raw);
    onChange(sanitized);
    setAvailable(null);
  };

  useEffect(() => {
    if (value.length < 3) { setAvailable(null); return; }
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const existing = await base44.entities.UserProfile.filter({ username: value });
        setAvailable(existing.length === 0);
      } catch (_) {
        setAvailable(null);
      }
      setChecking(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [value]);

  const isValid = /^[a-z0-9_.]{3,24}$/.test(value);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Choose your @username</h2>
        <p className="text-gray-400">This is how people will find you. It must be unique.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="yourname"
          maxLength={24}
          autoCapitalize="none"
          autoCorrect="off"
          className="w-full bg-gray-900 border border-gray-700 focus:border-[#00c6d2] text-white placeholder-gray-500 rounded-2xl py-4 pl-12 pr-12 text-lg outline-none transition-colors"
          autoFocus
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {checking && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
          {!checking && available === true && <Check className="w-5 h-5 text-green-400" />}
          {!checking && available === false && <X className="w-5 h-5 text-red-400" />}
        </div>
      </motion.div>

      <div className="space-y-1.5 text-sm">
        {value.length > 0 && !isValid && (
          <p className="text-red-400 text-xs">3–24 characters, only letters, numbers, _ and .</p>
        )}
        {available === false && (
          <p className="text-red-400 text-xs">@{value} is already taken. Try another.</p>
        )}
        {available === true && (
          <p className="text-green-400 text-xs">@{value} is available! ✨</p>
        )}
        {value.length === 0 && (
          <p className="text-gray-600 text-xs">e.g. @johndoe, @party_girl, @dj.mix</p>
        )}
      </div>
    </div>
  );
}
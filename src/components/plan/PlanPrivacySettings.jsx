import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Map, Lock, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '../common/LanguageContext';

export default function PlanPrivacySettings({ data, onChange }) {
  const [showAudience, setShowAudience] = useState(false);
  const [natInput, setNatInput] = useState('');
  const { t } = useLanguage();

  const r = data.audience_restrictions || {};

  const updateRestriction = (key, value) => {
    onChange({ audience_restrictions: { ...r, [key]: value } });
  };

  const addNationality = () => {
    const code = natInput.trim().toUpperCase().slice(0, 2);
    if (!code || code.length < 2) return;
    const existing = r.allowed_nationalities || [];
    if (!existing.includes(code)) updateRestriction('allowed_nationalities', [...existing, code]);
    setNatInput('');
  };

  const removeNationality = (code) => {
    updateRestriction('allowed_nationalities', (r.allowed_nationalities || []).filter(n => n !== code));
  };

  const isDark = !document.documentElement.classList.contains('light');

  return (
    <div className="space-y-4">
      {/* Public / Private toggle */}
      <div>
        <label className="text-gray-400 text-sm font-medium mb-2 block">{t.planType}</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: false, label: t.planTypePublic, emoji: '🌍', desc: t.planTypePublicDesc },
            { key: true,  label: t.planTypePrivate, emoji: '🔒', desc: t.planTypePrivateDesc },
          ].map(({ key, label, emoji, desc }) => (
            <motion.button
              key={String(key)}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange({
                is_private: key,
                show_in_map: key ? false : (data.show_in_map ?? true),
              })}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                (data.is_private ?? false) === key
                  ? 'border-[#00c6d2] bg-[#00c6d2]/10'
                  : 'border-gray-800 bg-gray-900'
              }`}
            >
              <div className="text-xl mb-1">{emoji}</div>
              <div className={`text-sm font-bold ${(data.is_private ?? false) === key ? 'text-[#00c6d2]' : 'text-white'}`}>{label}</div>
              <div className="text-xs text-gray-500">{desc}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Visibility toggles */}
      <div className="space-y-2">
        <label className="text-gray-400 text-sm font-medium block">{t.visibility}</label>

        {/* Show in Explore */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-3">
            <Eye className="w-4 h-4 text-[#00c6d2]" />
            <div>
              <p className="text-white text-sm font-medium">{t.showInExplore}</p>
              <p className="text-gray-500 text-xs">
                {data.is_private ? t.showInExploreLocked : t.showInExplorePublic}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange({ show_in_explore: !(data.show_in_explore ?? true) })}
            className={`relative w-11 h-6 rounded-full transition-all ${
              (data.show_in_explore ?? true) ? 'bg-[#00c6d2]' : 'bg-gray-700'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
              (data.show_in_explore ?? true) ? 'left-5' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Show in Map */}
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
          data.is_private ? 'bg-gray-900/40 border-gray-800/50 opacity-60' : 'bg-gray-900 border-gray-800'
        }`}>
          <div className="flex items-center gap-3">
            <Map className="w-4 h-4 text-[#542b9b]" />
            <div>
              <p className={`text-sm font-medium ${data.is_private ? 'text-gray-500' : 'text-white'}`}>{t.showInMap}</p>
              <p className="text-gray-500 text-xs">
                {data.is_private ? t.showInMapPrivate : t.showInMapDesc}
              </p>
            </div>
          </div>
          {data.is_private ? (
            <Lock className="w-4 h-4 text-gray-600" />
          ) : (
            <button
              type="button"
              onClick={() => onChange({ show_in_map: !(data.show_in_map ?? true) })}
              className={`relative w-11 h-6 rounded-full transition-all ${
                (data.show_in_map ?? true) ? 'bg-[#542b9b]' : 'bg-gray-700'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                (data.show_in_map ?? true) ? 'left-5' : 'left-0.5'
              }`} />
            </button>
          )}
        </div>
      </div>

      {/* Audience Restrictions (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowAudience(!showAudience)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 text-sm font-medium text-white"
        >
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span>{t.audienceRestrictions}</span>
            <span className="text-xs text-gray-500 font-normal">({t.optional})</span>
          </div>
          {showAudience ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        <AnimatePresence>
          {showAudience && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`mt-2 space-y-4 p-3 rounded-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                {/* Age Range */}
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">{t.ageRange}</label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder={t.ageMinPlaceholder}
                      value={r.min_age || ''}
                      onChange={(e) => updateRestriction('min_age', e.target.value ? parseInt(e.target.value) : null)}
                      className="bg-gray-800 border-gray-700 text-white text-sm"
                      min={18} max={99}
                    />
                    <span className="text-gray-600 flex-shrink-0">—</span>
                    <Input
                      type="number"
                      placeholder={t.ageMaxPlaceholder}
                      value={r.max_age || ''}
                      onChange={(e) => updateRestriction('max_age', e.target.value ? parseInt(e.target.value) : null)}
                      className="bg-gray-800 border-gray-700 text-white text-sm"
                      min={18} max={99}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">{t.genderLabel}</label>
                  <div className="flex gap-2">
                    {[
                      { key: 'female', label: t.genderFemale },
                      { key: 'male', label: t.genderMale },
                      { key: 'other', label: t.genderOther },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const existing = r.allowed_genders || [];
                          const updated = existing.includes(key)
                            ? existing.filter(x => x !== key)
                            : [...existing, key];
                          updateRestriction('allowed_genders', updated.length > 0 ? updated : null);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          (r.allowed_genders || []).includes(key)
                            ? 'bg-[#00c6d2]/20 text-[#00c6d2] border-[#00c6d2]/40'
                            : 'bg-gray-800 text-gray-400 border-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nationality */}
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">{t.nationalityLabel}</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={natInput}
                      onChange={(e) => setNatInput(e.target.value.toUpperCase().slice(0, 2))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNationality(); } }}
                      placeholder={t.nationalityPlaceholder}
                      className="bg-gray-800 border-gray-700 text-white text-sm flex-1"
                      maxLength={2}
                    />
                    <button
                      type="button"
                      onClick={addNationality}
                      className="px-3 rounded-lg bg-[#542b9b] text-white text-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {(r.allowed_nationalities || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.allowed_nationalities.map(code => (
                        <span key={code} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#542b9b]/30 text-purple-300 text-xs border border-[#542b9b]/40">
                          {code}
                          <button type="button" onClick={() => removeNationality(code)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
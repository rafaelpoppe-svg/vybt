import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, Image as ImageIcon, Palette, Loader2, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import PartyTag, { ALL_PARTY_TYPES } from '../common/PartyTag';
import { Search } from 'lucide-react';
import AddressAutocomplete from '../common/AddressAutocomplete';
import { GROUP_CHAT_THEMES } from '../chat/GroupChatBackground';
import PlanPrivacySettings from './PlanPrivacySettings';

const themeColors = [
  '#00c6d2', '#542b9b', '#ff6b6b', '#4ecdc4', '#45b7d1', 
  '#f7dc6f', '#bb8fce', '#85c1e9', '#f8b500', '#ff69b4'
];

export default function AdminEditModal({ isOpen, onClose, plan, onSave, isLoading, onDelete, isLive = false }) {
  const [tagSearch, setTagSearch] = useState('');
  const [formData, setFormData] = useState({
    title: plan?.title || '',
    time: plan?.time || '',
    end_time: plan?.end_time || '',
    location_address: plan?.location_address || '',
    city: plan?.city || '',
    cover_image: plan?.cover_image || '',
    theme_color: plan?.theme_color || '#00c6d2',
    tags: plan?.tags || [],
    chat_background_theme: plan?.chat_background_theme || 'default',
    is_private: plan?.is_private ?? false,
    show_in_explore: plan?.show_in_explore ?? true,
    show_in_map: plan?.show_in_map ?? true,
    audience_restrictions: plan?.audience_restrictions || {},
    price: plan?.price ?? undefined,
    min_age: plan?.min_age ?? undefined,
  });
  const [uploading, setUploading] = useState(false);

  if (!isOpen || !plan) return null;

  // Fields locked while plan is live
  const locked = isLive;

  const toggleTag = (tag) => {
    if (locked) return;
    if (formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    } else if (formData.tags.length < 2) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData({ ...formData, cover_image: file_url });
      } catch (err) {
        console.error(err);
      }
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="relative bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 z-10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <h2 className="text-2xl font-bold text-white mb-2">Editar Plano</h2>
          {locked && (
            <p className="text-orange-400 text-xs mb-4 bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2">
              ⚠️ Some fields are locked while the plan is Live.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Cover Image */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Capa do Plano
              </label>
              <label className="block cursor-pointer">
                {formData.cover_image ? (
                  <div className="relative h-32 rounded-xl overflow-hidden">
                    <img src={formData.cover_image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <span className="text-white text-sm">Alterar</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-32 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                    ) : (
                      <span className="text-gray-500 text-sm">Adicionar capa</span>
                    )}
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            {/* Title */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Nome do Plano {locked && <span className="text-orange-400 text-xs ml-1">🔒 locked</span>}
              </label>
              <Input
                value={formData.title}
                onChange={(e) => !locked && setFormData({ ...formData, title: e.target.value })}
                className={`border-gray-700 text-white ${locked ? 'bg-gray-800/40 opacity-50 cursor-not-allowed' : 'bg-gray-800'}`}
                readOnly={locked}
              />
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Início {locked && <span className="text-orange-400 text-xs">🔒</span>}
                </label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => !locked && setFormData({ ...formData, time: e.target.value })}
                  className={`border-gray-700 text-white ${locked ? 'bg-gray-800/40 opacity-50 cursor-not-allowed' : 'bg-gray-800'}`}
                  readOnly={locked}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Término
                </label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Endereço {locked && <span className="text-orange-400 text-xs ml-1">🔒 locked</span>}
              </label>
              {locked ? (
                <Input
                  value={formData.location_address}
                  readOnly
                  className="bg-gray-800/40 border-gray-700 text-white opacity-50 cursor-not-allowed"
                />
              ) : (
                <>
                  <AddressAutocomplete
                    value={formData.location_address}
                    onChange={(val) => setFormData(prev => ({ ...prev, location_address: val }))}
                    onSelect={({ address, city, latitude, longitude }) =>
                      setFormData(prev => ({ ...prev, location_address: address, city, latitude, longitude }))
                    }
                    placeholder="Search address..."
                  />
                  {formData.city && (
                    <div className="mt-2">
                      <label className="block text-gray-500 text-xs mb-1">City</label>
                      <Input
                        value={formData.city || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white text-sm"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Theme Color */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Cor do Grupo
              </label>
              <div className="flex gap-2 flex-wrap">
                {themeColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme_color: color })}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      formData.theme_color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Chat Background Theme */}
            <div>
              <label className="block text-gray-400 text-sm mb-3">Background do Chat</label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(GROUP_CHAT_THEMES).map(([key, theme]) => (
                  <motion.button
                    key={key}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setFormData({ ...formData, chat_background_theme: key })}
                    className="relative flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center ${
                        formData.chat_background_theme === key
                          ? 'border-[#00c6d2] ring-2 ring-[#00c6d2]/40'
                          : 'border-gray-700'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${theme.previewColor} 0%, ${theme.previewAccent} 100%)`
                      }}
                    >
                      {theme.emoji ? (
                        <span className="text-lg">{theme.emoji}</span>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                      {formData.chat_background_theme === key && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00c6d2] rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-[#0b0b0b]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">{theme.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-400 text-sm">
                  Party Tags (máx. 2) {locked && <span className="text-orange-400 text-xs ml-1">🔒 locked</span>}
                </label>
                <span className={`text-xs font-medium ${formData.tags.length >= 2 ? 'text-[#00c6d2]' : 'text-gray-500'}`}>
                  {formData.tags.length}/2
                </span>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00c6d2]"
                />
              </div>
              <div className={`flex flex-wrap gap-2 max-h-40 overflow-y-auto ${locked ? 'opacity-50 pointer-events-none' : ''}`}>
                {ALL_PARTY_TYPES.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).map((tag) => (
                  <PartyTag
                    key={tag}
                    tag={tag}
                    size="sm"
                    interactive={!locked}
                    selected={formData.tags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </div>

            {/* Price & Min Age */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Entry Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.price ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    placeholder="0 = free"
                    className="bg-gray-800 border-gray-700 text-white pl-7"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Min Age</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.min_age ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_age: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  placeholder="e.g. 18"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Privacy & Visibility */}
            <div>
              <label className="block text-gray-400 text-sm mb-3 font-medium">🔒 Privacy & Visibility</label>
              <PlanPrivacySettings
                data={formData}
                onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#00c6d2] text-[#0b0b0b] hover:bg-[#00c6d2]/90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="w-full mt-2 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Deletar Grupo
              </button>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
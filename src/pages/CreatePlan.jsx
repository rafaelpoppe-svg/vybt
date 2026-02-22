import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, MapPin, Calendar, Clock, Tag, Image as ImageIcon, Loader2, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import PartyTag, { ALL_PARTY_TYPES } from '../components/common/PartyTag';
import { Search } from 'lucide-react';

const themeColors = [
  '#00fea3', '#542b9b', '#ff6b6b', '#4ecdc4', '#45b7d1', 
  '#f7dc6f', '#bb8fce', '#85c1e9', '#f8b500', '#ff69b4'
];

export default function CreatePlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [data, setData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    end_time: '',
    location_address: '',
    city: '',
    tags: [],
    cover_image: '',
    group_image: '',
    theme_color: '#00fea3'
  });

  // Date limits: today → today + 30 days
  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  // Compute max end_time: start_time + 8h (wraps past midnight)
  const getMaxEndTime = (startTime) => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + 8 * 60;
    const endH = Math.floor((totalMins % (24 * 60)) / 60);
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  // Validate that end_time is within 8h of start_time
  const isEndTimeValid = (startTime, endTime) => {
    if (!startTime || !endTime) return true;
    const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let diff = toMins(endTime) - toMins(startTime);
    if (diff < 0) diff += 24 * 60; // overnight
    return diff > 0 && diff <= 8 * 60;
  };

  const handleEndTimeChange = (val) => {
    setData({ ...data, end_time: val });
  };

  const toggleTag = (tag) => {
    if (data.tags.includes(tag)) {
      setData({ ...data, tags: data.tags.filter(t => t !== tag) });
    } else if (data.tags.length < 2) {
      setData({ ...data, tags: [...data.tags, tag] });
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setData({ ...data, [field]: file_url });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!data.title || !data.date || !data.time || !data.location_address || !data.city) {
      return;
    }
    setLoading(true);
    try {
      const user = await base44.auth.me();

      // Geocode address to get lat/lng for map
      let latitude = null, longitude = null;
      try {
        const query = encodeURIComponent(`${data.location_address}, ${data.city}`);
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
        const geoData = await geoRes.json();
        if (geoData?.[0]) {
          latitude = parseFloat(geoData[0].lat);
          longitude = parseFloat(geoData[0].lon);
        }
      } catch (_) {}

      const plan = await base44.entities.PartyPlan.create({
        ...data,
        creator_id: user.id,
        view_count: 0,
        is_highlighted: false,
        ...(latitude && longitude ? { latitude, longitude } : {})
      });
      
      // Auto-join creator
      await base44.entities.PlanParticipant.create({
        plan_id: plan.id,
        user_id: user.id,
        status: 'going'
      });

      navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const isValid = data.title && data.date && data.time && data.end_time && data.location_address && data.city && isEndTimeValid(data.time, data.end_time);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 p-4 flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-900"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        <h1 className="text-xl font-bold text-white">Create Plan</h1>
      </header>

      <main className="p-4 pb-32 space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Cover Image</label>
          <label className="block">
            {data.cover_image ? (
              <div className="relative h-40 rounded-xl overflow-hidden">
                <img src={data.cover_image} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-sm">Change</span>
                </div>
              </div>
            ) : (
              <div className="h-40 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-600 transition-colors">
                <ImageIcon className="w-8 h-8 text-gray-600" />
                <span className="text-gray-500 text-sm">Add cover image</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover_image')} className="hidden" />
          </label>
        </div>

        {/* Group Image */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Group Chat Image (optional)</label>
          <label className="block">
            <div className="flex items-center gap-4">
              {data.group_image ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                  <img src={data.group_image} alt="Group" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-gray-600">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <span className="text-gray-500 text-sm">Small icon for group chat</span>
            </div>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'group_image')} className="hidden" />
          </label>
        </div>

        {/* Theme Color */}
        <div>
          <label className="block text-gray-400 text-sm mb-2 flex items-center gap-1.5">
            <Palette className="w-4 h-4" />
            Group Theme Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {themeColors.map((color) => (
              <motion.button
                key={color}
                whileTap={{ scale: 0.9 }}
                onClick={() => setData({ ...data, theme_color: color })}
                className={`w-10 h-10 rounded-xl transition-all ${
                  data.theme_color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b0b0b]' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Plan Title *</label>
          <Input
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="e.g. Techno Night at Rooftop"
            className="bg-gray-900 border-gray-800 text-white"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Description</label>
          <Textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            placeholder="Tell people about this plan..."
            className="bg-gray-900 border-gray-800 text-white min-h-24"
          />
        </div>

        {/* Date & Time */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data *
          </label>
          <Input
            type="date"
            value={data.date}
            min={todayStr}
            max={maxDateStr}
            onChange={(e) => {
              const val = e.target.value;
              if (val < todayStr || val > maxDateStr) return;
              setData({ ...data, date: val });
            }}
            className="bg-gray-900 border-gray-800 text-white"
          />
          <p className="text-xs text-gray-600 mt-1">Máximo 30 dias a partir de hoje</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Início *
            </label>
            <Input
              type="time"
              value={data.time}
              onChange={(e) => setData({ ...data, time: e.target.value, end_time: '' })}
              className="bg-gray-900 border-gray-800 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Término *
            </label>
            <Input
              type="time"
              value={data.end_time}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              disabled={!data.time}
              className="bg-gray-900 border-gray-800 text-white disabled:opacity-40"
            />
            {data.time && (
              <p className="text-xs text-gray-600 mt-1">
                Máx. {getMaxEndTime(data.time)}
              </p>
            )}
            {data.time && data.end_time && !isEndTimeValid(data.time, data.end_time) && (
              <p className="text-xs text-red-500 mt-1">Máximo 8h de duração</p>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Address *
          </label>
          <Input
            value={data.location_address}
            onChange={(e) => setData({ ...data, location_address: e.target.value })}
            placeholder="e.g. Gran Via 123, Madrid"
            className="bg-gray-900 border-gray-800 text-white"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">City *</label>
          <Input
            value={data.city}
            onChange={(e) => setData({ ...data, city: e.target.value })}
            placeholder="e.g. Madrid"
            className="bg-gray-900 border-gray-800 text-white"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Party Type Tags (máx. 2)
          </label>
          <div className="flex flex-wrap gap-2">
            {partyTags.map((tag) => (
              <PartyTag
                key={tag}
                tag={tag}
                size="md"
                interactive
                selected={data.tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        {data.theme_color && (
          <div 
            className="p-4 rounded-xl border"
            style={{ 
              borderColor: data.theme_color,
              backgroundColor: `${data.theme_color}10`
            }}
          >
            <p className="text-sm text-gray-400 mb-2">Group Chat Preview</p>
            <div className="flex items-center gap-3">
              {data.group_image ? (
                <img src={data.group_image} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: data.theme_color }}
                >
                  <span>🎉</span>
                </div>
              )}
              <div>
                <div className="flex gap-1 mb-0.5">
                  {data.tags.slice(0, 2).map((tag, i) => (
                    <PartyTag key={i} tag={tag} size="sm" />
                  ))}
                </div>
                <p className="text-white font-medium">{data.title || 'Plan Title'}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b] to-transparent">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className={`w-full py-6 rounded-full font-bold text-lg ${
            isValid
              ? 'bg-[#00fea3] text-[#0b0b0b] hover:bg-[#00fea3]/90'
              : 'bg-gray-800 text-gray-500'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Create Plan'
          )}
        </Button>
      </div>
    </div>
  );
}
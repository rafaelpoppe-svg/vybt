import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, MapPin, Calendar, Clock, Tag, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const partyTags = [
  'Rooftop Afternoon', 'Rooftop Night', 'Techno', 'Bar', 'Luxury', 
  'House Party', 'University', 'Commercial', 'EDM', 'Latin'
];

export default function CreatePlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location_address: '',
    city: '',
    tags: [],
    cover_image: ''
  });

  const toggleTag = (tag) => {
    if (data.tags.includes(tag)) {
      setData({ ...data, tags: data.tags.filter(t => t !== tag) });
    } else if (data.tags.length < 5) {
      setData({ ...data, tags: [...data.tags, tag] });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setData({ ...data, cover_image: file_url });
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
      const plan = await base44.entities.PartyPlan.create({
        ...data,
        creator_id: user.id,
        view_count: 0,
        is_highlighted: false
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

  const isValid = data.title && data.date && data.time && data.location_address && data.city;

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
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date *
            </label>
            <Input
              type="date"
              value={data.date}
              onChange={(e) => setData({ ...data, date: e.target.value })}
              className="bg-gray-900 border-gray-800 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Time *
            </label>
            <Input
              type="time"
              value={data.time}
              onChange={(e) => setData({ ...data, time: e.target.value })}
              className="bg-gray-900 border-gray-800 text-white"
            />
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
            Tags (max 5)
          </label>
          <div className="flex flex-wrap gap-2">
            {partyTags.map((tag) => {
              const isSelected = data.tags.includes(tag);
              return (
                <motion.button
                  key={tag}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#00fea3] text-[#0b0b0b]'
                      : 'bg-gray-900 text-gray-400 border border-gray-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  {tag}
                </motion.button>
              );
            })}
          </div>
        </div>
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
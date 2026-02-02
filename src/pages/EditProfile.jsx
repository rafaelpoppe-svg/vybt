import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Camera, Loader2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const vibeOptions = [
  'Techno', 'Reggaeton', 'Pop', 'House', 'Trap', 
  'Afrobeats', 'Brazilian Funk', 'Hard Techno', 
  '80s Songs', 'EDM', 'Rock', 'Disco', 
  'Curious to every style'
];

export default function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    city: '',
    radius_km: 10,
    vibes: [],
    photos: []
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        navigate(createPageUrl('Onboarding'));
      }
    };
    getUser();
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile', currentUser?.id],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: currentUser.id }),
    select: (data) => data[0],
    enabled: !!currentUser?.id,
    onSuccess: (data) => {
      if (data) {
        setFormData({
          display_name: data.display_name || '',
          city: data.city || '',
          radius_km: data.radius_km || 10,
          vibes: data.vibes || [],
          photos: data.photos || []
        });
      }
    }
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        city: profile.city || '',
        radius_km: profile.radius_km || 10,
        vibes: profile.vibes || [],
        photos: profile.photos || []
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.UserProfile.update(profile.id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myProfile', currentUser?.id]);
      navigate(createPageUrl('Profile'));
    }
  });

  const handlePhotoUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const newPhotos = [...formData.photos];
        newPhotos[index] = file_url;
        setFormData({ ...formData, photos: newPhotos });
      } catch (err) {
        console.error(err);
      }
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...formData.photos];
    newPhotos[index] = '';
    setFormData({ ...formData, photos: newPhotos.filter(p => p) });
  };

  const toggleVibe = (vibe) => {
    if (formData.vibes.includes(vibe)) {
      setFormData({ ...formData, vibes: formData.vibes.filter(v => v !== vibe) });
    } else if (formData.vibes.length < 5) {
      setFormData({ ...formData, vibes: [...formData.vibes, vibe] });
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
      </div>
    );
  }

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
        <h1 className="text-xl font-bold text-white">Edit Profile</h1>
      </header>

      <main className="p-4 pb-32 space-y-6">
        {/* Photos */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Photos (max 3)</label>
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <label key={i} className="relative">
                <div className={`${i === 0 ? 'w-28 h-28' : 'w-20 h-20'} rounded-xl overflow-hidden cursor-pointer ${
                  formData.photos[i] ? '' : 'bg-gray-800 border-2 border-dashed border-gray-700'
                }`}>
                  {formData.photos[i] ? (
                    <>
                      <img 
                        src={formData.photos[i]} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removePhoto(i);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handlePhotoUpload(e, i)} 
                  className="hidden" 
                />
                <span className="text-[10px] text-gray-500 absolute -bottom-4 left-0 right-0 text-center">
                  {i === 0 ? 'Main' : `Photo ${i + 1}`}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Display Name</label>
          <Input
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="Your name"
            className="bg-gray-900 border-gray-800 text-white"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">City</label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="e.g. Madrid"
            className="bg-gray-900 border-gray-800 text-white"
          />
        </div>

        {/* Radius */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Search Radius: {formData.radius_km}km</label>
          <input
            type="range"
            min="5"
            max="100"
            value={formData.radius_km}
            onChange={(e) => setFormData({ ...formData, radius_km: Number(e.target.value) })}
            className="w-full accent-[#00fea3]"
          />
        </div>

        {/* Vibes */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Your Vibes (max 5)</label>
          <div className="flex flex-wrap gap-2">
            {vibeOptions.map((vibe) => {
              const isSelected = formData.vibes.includes(vibe);
              return (
                <motion.button
                  key={vibe}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleVibe(vibe)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#00fea3] text-[#0b0b0b]'
                      : 'bg-gray-900 text-gray-400 border border-gray-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  {vibe}
                </motion.button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b] to-transparent">
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="w-full py-6 rounded-full font-bold text-lg bg-[#00fea3] text-[#0b0b0b] hover:bg-[#00fea3]/90"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
}
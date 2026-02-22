import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Camera, Loader2, X, Navigation, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import VibeTag from '../components/common/VibeTag';
import PartyTag from '../components/common/PartyTag';

const vibeOptions = [
  'Techno', 'Reggaeton', 'Pop', 'House', 'Trap', 
  'Afrobeats', 'Brazilian Funk', 'Hard Techno', 
  '80s Songs', 'EDM', 'Rock', 'Disco', 
  'Curious to every style'
];

const partyTypeOptions = [
  'Rooftop Afternoon', 'Rooftop Night', 'Techno', 'Bar', 'Luxury', 
  'House Party', 'University', 'Commercial', 'EDM', 'Latin'
];

export default function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    city: '',
    date_of_birth: '',
    radius_km: 10,
    vibes: [],
    party_types: [],
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
    enabled: !!currentUser?.id
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        city: profile.city || '',
        date_of_birth: profile.date_of_birth || '',
        radius_km: profile.radius_km || 10,
        vibes: profile.vibes || [],
        party_types: profile.party_types || [],
        photos: profile.photos || []
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      // If photos changed and profile was verified, remove verification
      const photosChanged = JSON.stringify(formData.photos) !== JSON.stringify(profile.photos || []);
      const updateData = { ...formData };
      if (photosChanged && profile.is_verified) {
        updateData.is_verified = false;
        updateData.verification_selfie_url = '';
      }
      await base44.entities.UserProfile.update(profile.id, updateData);
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

  const togglePartyType = (type) => {
    if (formData.party_types.includes(type)) {
      setFormData({ ...formData, party_types: formData.party_types.filter(t => t !== type) });
    } else if (formData.party_types.length < 5) {
      setFormData({ ...formData, party_types: [...formData.party_types, type] });
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

        {/* Bio */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Bio</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell others about yourself..."
            className="bg-gray-900 border-gray-800 text-white min-h-20"
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">{formData.bio.length}/200</p>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Date of Birth</label>
          <Input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            className="bg-gray-900 border-gray-800 text-white"
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
          />
          {formData.date_of_birth && (
            <p className="text-xs text-gray-500 mt-1">
              Age: {Math.floor((new Date() - new Date(formData.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))} years old
            </p>
          )}
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
            {vibeOptions.map((vibe) => (
              <VibeTag
                key={vibe}
                vibe={vibe}
                size="md"
                interactive
                selected={formData.vibes.includes(vibe)}
                onClick={() => toggleVibe(vibe)}
              />
            ))}
          </div>
        </div>

        {/* Party Types */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-400 text-sm">Preferred Party Types</label>
            <span className={`text-xs font-medium ${formData.party_types.length >= 5 ? 'text-[#00fea3]' : 'text-gray-500'}`}>
              {formData.party_types.length}/5
            </span>
          </div>
          {formData.party_types.length >= 5 && (
            <p className="text-xs text-[#00fea3]/70 mb-2">Limite atingido. Remove um para selecionar outro.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {partyTypeOptions.map((type) => (
              <PartyTag
                key={type}
                tag={type}
                size="md"
                interactive
                selected={formData.party_types.includes(type)}
                onClick={() => togglePartyType(type)}
              />
            ))}
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
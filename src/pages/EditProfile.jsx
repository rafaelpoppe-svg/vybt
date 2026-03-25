import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Camera, Loader2, X, Navigation, MapPin, Search, Flame, AtSign, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import VibeTag, { ALL_VIBES } from '../components/common/VibeTag';
import PartyTag, { ALL_PARTY_TYPES, partyTagConfig } from '../components/common/PartyTag';
import BackgroundThemeSelector from '../components/profile/BackgroundThemeSelector';

function PartyTypeFilterList({ allTypes, selected, onToggle }) {
  const [search, setSearch] = React.useState('');
  const filtered = allTypes.filter(t => t.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search party types..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#00c6d2] border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {filtered.map((type) => (
          <PartyTag
            key={type}
            tag={type}
            size="md"
            interactive
            selected={selected.includes(type)}
            onClick={() => onToggle(type)}
          />
        ))}
      </div>
    </div>
  );
}



export default function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    bio: '',
    city: '',
    date_of_birth: '',
    radius_km: 10,
    vibes: [],
    party_types: [],
    photos: [],
    profile_background_theme: 'default'
  });
  const [uploading, setUploading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [vibeSearch, setVibeSearch] = useState('');

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            null;
          if (detectedCity) setFormData(prev => ({ ...prev, city: detectedCity }));
        } catch (_) {}
        setDetectingLocation(false);
      },
      () => setDetectingLocation(false),
      { timeout: 8000 }
    );
  };

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
        username: profile.username || '',
        bio: profile.bio || '',
        city: profile.city || '',
        date_of_birth: profile.date_of_birth || '',
        radius_km: profile.radius_km || 10,
        vibes: profile.vibes || [],
        party_types: profile.party_types || [],
        photos: profile.photos || [],
        profile_background_theme: profile.profile_background_theme || 'default'
      });
    }
  }, [profile]);

  // Check username availability (debounced)
  useEffect(() => {
    const username = formData.username.trim();
    if (!username || username === profile?.username) { setUsernameAvailable(null); return; }
    if (!/^[a-z0-9_.]{3,24}$/.test(username)) { setUsernameAvailable(null); return; }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const existing = await base44.entities.UserProfile.filter({ username });
        setUsernameAvailable(existing.length === 0 || existing[0]?.user_id === currentUser?.id);
      } catch (_) {}
      setCheckingUsername(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.username]);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg border-b p-4 flex items-center gap-4" style={{ background: 'var(--header-bg)', borderColor: 'var(--border)' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full"
          style={{ background: 'var(--surface-2)' }}
        >
          <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </motion.button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit Profile</h1>
      </header>

      <main className="p-4 pb-32 space-y-6">
        {/* Photos */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Photos (max 5) — 1st is profile picture</label>
          <div className="flex gap-3 flex-wrap">
            {[0, 1, 2, 3, 4].map((i) => (
              <label key={i} className="relative" style={{ marginBottom: '1.25rem' }}>
                <div className={`${i === 0 ? 'w-28 h-28' : 'w-[72px] h-[72px]'} rounded-xl overflow-hidden cursor-pointer ${
                  formData.photos[i] ? '' : 'border-2 border-dashed'
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
                <span className="text-[10px] absolute -bottom-4 left-0 right-0 text-center" style={{ color: 'var(--text-muted)' }}>
                  {i === 0 ? '📸 Main' : `Photo ${i + 1}`}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Username</label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <Input
              value={formData.username}
              onChange={(e) => {
                const v = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 24);
                setFormData({ ...formData, username: v });
                setUsernameAvailable(null);
              }}
              placeholder="yourname"
              autoCapitalize="none"
              autoCorrect="off"
              className="pl-9 pr-9"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checkingUsername && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
              {!checkingUsername && usernameAvailable === true && <Check className="w-4 h-4 text-green-400" />}
              {!checkingUsername && usernameAvailable === false && <X className="w-4 h-4 text-red-400" />}
            </div>
          </div>
          {formData.username && !/^[a-z0-9_.]{3,24}$/.test(formData.username) && (
            <p className="text-xs text-red-400 mt-1">3–24 chars, only letters, numbers, _ and .</p>
          )}
          {usernameAvailable === false && <p className="text-xs text-red-400 mt-1">@{formData.username} is already taken.</p>}
          {usernameAvailable === true && <p className="text-xs text-green-400 mt-1">@{formData.username} is available!</p>}
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Display Name</label>
          <Input
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="Your name"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Bio</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell others about yourself..."
            className="min-h-20"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            maxLength={70}
          />
          <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{formData.bio.length}/70</p>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Date of Birth</label>
          <Input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
          />
          {formData.date_of_birth && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Age: {Math.floor((new Date() - new Date(formData.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))} years old
            </p>
          )}
        </div>

        {/* City / Location */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Your Location</label>
          <button
            type="button"
            onClick={detectLocation}
            disabled={detectingLocation}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left disabled:opacity-50 border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {detectingLocation ? (
              <Loader2 className="w-5 h-5 text-[#00c6d2] animate-spin flex-shrink-0" />
            ) : (
              <Navigation className="w-5 h-5 text-[#00c6d2] flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              {formData.city ? (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#00c6d2]" />
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{formData.city}</span>
                </div>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {detectingLocation ? 'Detecting your location...' : 'Tap to use current location'}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Radius */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Search Radius: {formData.radius_km}km</label>
          <input
            type="range"
            min="5"
            max="100"
            value={formData.radius_km}
            onChange={(e) => setFormData({ ...formData, radius_km: Number(e.target.value) })}
            className="w-full accent-[#00c6d2]"
          />
        </div>

        {/* Vibes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your Vibes (max 5)</label>
            <span className={`text-xs font-medium ${formData.vibes.length >= 5 ? 'text-[#00c6d2]' : ''}`} style={formData.vibes.length < 5 ? { color: 'var(--text-muted)' } : {}}>
              {formData.vibes.length}/5
            </span>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search vibes..."
              onChange={(e) => {
                const val = e.target.value.toLowerCase();
                setVibeSearch(val);
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#00c6d2] border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          {formData.vibes.length >= 5 && (
            <p className="text-xs text-[#00c6d2]/70 mb-2">Limit reached — deselect one to pick another.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {ALL_VIBES.filter(v => v.toLowerCase().includes(vibeSearch || '')).map((vibe) => (
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
            <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Preferred Party Types</label>
            <span className={`text-xs font-medium ${formData.party_types.length >= 5 ? 'text-[#00c6d2]' : ''}`} style={formData.party_types.length < 5 ? { color: 'var(--text-muted)' } : {}}>
              {formData.party_types.length}/5
            </span>
          </div>
          {formData.party_types.length >= 5 && (
            <p className="text-xs text-[#00c6d2]/70 mb-2">Limit reached — deselect one to pick another.</p>
          )}
          <PartyTypeFilterList
            allTypes={ALL_PARTY_TYPES}
            selected={formData.party_types}
            onToggle={togglePartyType}
          />
        </div>

        {/* Background Theme */}
        <div>
          <BackgroundThemeSelector
            selectedTheme={formData.profile_background_theme}
            onSelect={(theme) => setFormData({ ...formData, profile_background_theme: theme })}
          />
        </div>
        </main>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(to top, var(--bg) 60%, transparent)' }}>
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="w-full py-6 rounded-full font-bold text-lg bg-[#00c6d2] text-[#0b0b0b] hover:bg-[#00c6d2]/90"
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
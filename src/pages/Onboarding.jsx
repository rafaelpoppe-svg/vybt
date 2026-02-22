import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Navigation, MapPin, Loader2, ShieldCheck, Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GenderSelect from '../components/onboarding/GenderSelect';
import DateOfBirthSelect from '../components/onboarding/DateOfBirthSelect';
import PhotoUploadStep from '../components/onboarding/PhotoUploadStep';
import VibesSelect from '../components/onboarding/VibesSelect';
import PartyTypeSelect from '../components/onboarding/PartyTypeSelect';
import WelcomeComplete from '../components/onboarding/WelcomeComplete';
import LanguageSelect from '../components/onboarding/LanguageSelect';
import VerificationFlow from '../components/profile/VerificationFlow';
import { useLanguage } from '../components/common/LanguageContext';

function OnboardingInner() {
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    language: language,
    gender: '',
    date_of_birth: '',
    photos: [],
    vibes: [],
    party_types: [],
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [detectingCity, setDetectingCity] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [createdProfile, setCreatedProfile] = useState(null);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingCity(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const d = await res.json();
          const detectedCity =
            d.address?.city || d.address?.town || d.address?.village || d.address?.county || null;
          if (detectedCity) setData(prev => ({ ...prev, city: detectedCity }));
        } catch (_) {}
        setDetectingCity(false);
      },
      () => setDetectingCity(false),
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles?.[0]?.onboarding_completed) {
          navigate(createPageUrl('Home'));
        }
      } catch (e) {}
    };
    checkOnboarding();
  }, [navigate]);

  const canProceed = () => {
    switch(step) {
      case 0: return data.language !== '';
      case 1: return data.gender !== '';
      case 2: return data.date_of_birth !== '';
      case 3: return data.photos.length > 0;
      case 4: return data.vibes.length >= 2;
      case 5: return data.party_types.length >= 2;
      case 6: return true; // location is optional
      default: return true;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const profile = await base44.entities.UserProfile.create({
        user_id: user.id,
        display_name: user.full_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        photos: data.photos,
        vibes: data.vibes,
        party_types: data.party_types,
        city: data.city || '',
        radius_km: 10,
        onboarding_completed: true,
        total_stories_count: 0
      });
      setCreatedProfile(profile);
      setStep(8); // verification step
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const skipToHome = () => navigate(createPageUrl('Home'));

  const steps = [
    <LanguageSelect
      selected={data.language}
      onSelect={(lang) => { changeLanguage(lang); setData({...data, language: lang}); }}
    />,
    <GenderSelect 
      selected={data.gender} 
      onSelect={(gender) => setData({...data, gender})} 
    />,
    <DateOfBirthSelect 
      value={data.date_of_birth}
      onChange={(date_of_birth) => setData({...data, date_of_birth})}
    />,
    <PhotoUploadStep 
      photos={data.photos}
      onChange={(photos) => setData({...data, photos})}
    />,
    <VibesSelect 
      selected={data.vibes} 
      onSelect={(vibes) => setData({...data, vibes})} 
    />,
    <PartyTypeSelect 
      selected={data.party_types} 
      onSelect={(party_types) => setData({...data, party_types})} 
    />,
    // Location step
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">{t.whereAreYou}</h2>
        <p className="text-gray-400">{t.locationSubtitle}</p>
      </div>
      <button
        type="button"
        onClick={detectLocation}
        disabled={detectingCity}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#00fea3]/10 border border-[#00fea3]/40 text-left disabled:opacity-50"
      >
        {detectingCity ? (
          <Loader2 className="w-6 h-6 text-[#00fea3] animate-spin flex-shrink-0" />
        ) : (
          <Navigation className="w-6 h-6 text-[#00fea3] flex-shrink-0" />
        )}
        <div>
          <p className="text-white font-semibold">
            {detectingCity ? t.detecting : data.city ? data.city : t.useMyLocation}
          </p>
          {!detectingCity && !data.city && (
            <p className="text-gray-500 text-sm mt-0.5">{t.tapToDetect}</p>
          )}
        </div>
      </button>
      {data.city && (
        <div className="flex items-center gap-2 text-[#00fea3] text-sm">
          <MapPin className="w-4 h-4" />
          <span>{t.locationSetTo} <strong>{data.city}</strong></span>
        </div>
      )}
    </div>,
    <WelcomeComplete onExplore={handleComplete} />,
    // step 8 — verify (handled separately below)
    null,
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => step > 0 && setStep(step - 1)}
          className={`p-2 rounded-full ${step === 0 ? 'opacity-0' : 'bg-gray-900'}`}
          disabled={step === 0}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </motion.button>
        
        <div className="flex-1 flex justify-center">
          <span className="text-2xl font-black bg-gradient-to-r from-[#00fea3] to-[#542b9b] bg-clip-text text-transparent">
            Vybt
          </span>
        </div>
        
        <div className="w-10" />
      </div>

      {/* Progress */}
      {step < 7 && (
        <div className="px-6 mb-8">
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? 'bg-[#00fea3]' : 'bg-gray-800'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Button */}
      {step < 7 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b] to-transparent">
          <motion.button
            whileHover={{ scale: canProceed() ? 1.02 : 1 }}
            whileTap={{ scale: canProceed() ? 0.98 : 1 }}
            onClick={() => canProceed() && setStep(step + 1)}
            disabled={!canProceed()}
            className={`w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              canProceed()
                ? 'bg-[#00fea3] text-[#0b0b0b]'
                : 'bg-gray-800 text-gray-500'
            }`}
          >
            {t.continue}
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      )}
    </div>
  );
}

export default function Onboarding() {
  return <OnboardingInner />;
}
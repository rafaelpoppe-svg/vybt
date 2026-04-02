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
import NameSelect from '../components/onboarding/NameSelect';
import VerificationFlow from '../components/profile/VerificationFlow';
import NationalitySelect from '../components/onboarding/NationalitySelect';
import UsernameSelect from '../components/onboarding/UsernameSelect';
import { useLanguage } from '../components/common/LanguageContext';

const ONBOARDING_CITIES = [
  'Braga', 'Porto', 'Lisbon',
  'London', 'Madrid', 'Barcelona', 'Paris', 'Berlin', 'Amsterdam',
  'Rome', 'Milan', 'Vienna', 'Prague', 'Warsaw', 'Bucharest',
  'Budapest', 'Athens', 'Dublin', 'Stockholm', 'Oslo', 'Copenhagen',
  'New York', 'Los Angeles', 'Miami', 'Chicago', 'San Francisco',
];

function LocationStep({ city, onCityChange, detectLocation, detectingCity, t }) {
  const [search, setSearch] = React.useState('');
  const isDark = !document.documentElement.classList.contains('light');
  const filtered = ONBOARDING_CITIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t.whereAreYou}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{t.locationSubtitle}</p>
      </div>
      <button
        type="button"
        onClick={detectLocation}
        disabled={detectingCity}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#00c6d2]/10 border border-[#00c6d2]/40 text-left disabled:opacity-50"
      >
        {detectingCity ? (
          <Loader2 className="w-6 h-6 text-[#00c6d2] animate-spin flex-shrink-0" />
        ) : (
          <Navigation className="w-6 h-6 text-[#00c6d2] flex-shrink-0" />
        )}
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {detectingCity ? t.detecting : city ? city : t.useMyLocation}
          </p>
          {!detectingCity && !city && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.tapToDetect}</p>
          )}
        </div>
      </button>
      {city && (
        <div className="flex items-center gap-2 text-[#00c6d2] text-sm">
          <MapPin className="w-4 h-4" />
          <span>{t.locationSetTo} <strong>{city}</strong></span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or search city</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Search city..."
        className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-500 border focus:outline-none focus:border-[#00c6d2]/60"
        style={{ 
          background: isDark ? 'rgba(255,255,255,0.06)' : 'white',
          color: isDark ? 'white' : '#1a1a1a',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
          fontSize: '16px' 
        }}
      />
      <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-hide">
        {filtered.map(c => (
          <motion.button
            key={c}
            whileTap={{ scale: 0.97 }}
            onClick={() => onCityChange(c)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-all"
            style={city === c ? {
              background: 'rgba(0,198,210,0.15)',
              border: '1px solid rgba(0,198,210,0.4)',
              color: '#00c6d2',
            } : {
              background: isDark ? 'rgba(255,255,255,0.04)' : 'white',
              border: isDark ? '1px solid transparent' : '1px solid #e5e7eb',
              color: isDark ? 'var(--text-secondary)' : '#374151',
            }}
          >
            <span className={city === c ? 'font-bold' : ''}>{c}</span>
            {city === c && <span className="text-xs font-bold text-[#00c6d2]">✓</span>}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function OnboardingInner() {
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    language: language,
    display_name: '',
    username: '',
    gender: '',
    date_of_birth: '',
    photos: [],
    vibes: [],
    party_types: [],
    city: '',
    nationality: ''
  });
  const [loading, setLoading] = useState(false);
  const [detectingCity, setDetectingCity] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [createdProfile, setCreatedProfile] = useState(null);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

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
    // Persist referral code from URL into sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) sessionStorage.setItem('vybt_ref', ref);

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
      case 1: return data.display_name.trim().length >= 2;
      case 2: return /^[a-z0-9_.]{3,24}$/.test(data.username) && usernameAvailable === true;
      case 3: return data.gender !== '';
      case 4: return data.date_of_birth !== '';
      case 5: return data.photos.length > 0;
      case 6: return data.vibes.length >= 2;
      case 7: return data.party_types.length >= 2;
      case 8: return true; // location is optional
      case 9: return true; // nationality is optional
      default: return true;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();

      // Check for referral code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref') || sessionStorage.getItem('vybt_ref') || '';

      const profile = await base44.entities.UserProfile.create({
        user_id: user.id,
        username: data.username.trim() || undefined,
        display_name: data.display_name.trim() || user.full_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        photos: data.photos,
        vibes: data.vibes,
        party_types: data.party_types,
        city: data.city || '',
        nationality: data.nationality || '',
        radius_km: 10,
        onboarding_completed: true,
        total_stories_count: 0,
        referred_by: refCode || ''
      });

      // Increment referrer's count if referred
      if (refCode) {
        try {
          const referrers = await base44.entities.UserProfile.filter({ referral_code: refCode });
          if (referrers[0]) {
            const newCount = (referrers[0].referred_count || 0) + 1;
            const becomeAmbassador = newCount >= 10;
            await base44.entities.UserProfile.update(referrers[0].id, {
              referred_count: newCount,
              ...(becomeAmbassador ? { is_ambassador: true } : {})
            });
          }
          sessionStorage.removeItem('vybt_ref');
        } catch (e) {}
      }
      setCreatedProfile(profile);
      setStep(11); // verification step
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
    <NameSelect
      value={data.display_name}
      onChange={(display_name) => setData({...data, display_name})}
    />,
    <UsernameSelect
      value={data.username}
      onChange={(username) => { setData({...data, username}); setUsernameAvailable(null); }}
      onAvailabilityChange={setUsernameAvailable}
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
    <LocationStep
      city={data.city}
      onCityChange={(city) => setData(prev => ({ ...prev, city }))}
      detectLocation={detectLocation}
      detectingCity={detectingCity}
      t={t}
    />,
    // Nationality step (optional)
    <NationalitySelect
      selected={data.nationality}
      onSelect={(nationality) => setData({...data, nationality})}
    />,
    <WelcomeComplete onExplore={handleComplete} />,
    // step 11 — verify (handled separately below)
    null,
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => step > 0 && setStep(step - 1)}
          className={`p-2 rounded-full ${step === 0 ? 'opacity-0' : ''}`}
          style={step === 0 ? {} : { background: 'var(--surface)' }}
          disabled={step === 0}
        >
          <ChevronLeft className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
        </motion.button>
        
        <div className="flex-1 flex justify-center">
          <span className="text-2xl font-black bg-gradient-to-r from-[#00c6d2] to-[#542b9b] bg-clip-text text-transparent">
            Vybt
          </span>
        </div>
        
        <div className="w-10" />
      </div>

      {/* Progress */}
      {step < 10 && (
        <div className="px-6 mb-8">
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <motion.div 
                key={i}
                animate={{
                  backgroundColor: i <= step ? '#00c6d2' : '#1f2937',
                  scaleX: i === step ? 1.1 : 1
                }}
                transition={{ duration: 0.4 }}
                className="h-1 flex-1 rounded-full origin-left"
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
            initial={{ opacity: 0, x: 60, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            {step === 11 ? (
              <div className="space-y-6 text-center">
                <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-12 h-12 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t.verifyYourProfile}</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Take a live selfie to get a <span className="text-blue-400 font-semibold">blue verified badge</span> and build trust with other users.</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowVerification(true)}
                  className="w-full py-4 rounded-full font-bold text-lg bg-blue-500 text-white flex items-center justify-center gap-2"

                >
                  <Camera className="w-5 h-5" />
                  Verify Now
                </motion.button>
                <button
                  onClick={skipToHome}
                  className="w-full py-3 text-sm transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Skip for now
                </button>
              </div>
            ) : (
              steps[step]
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Button */}
      {step < 10 && (
        <div className="fixed bottom-0 left-0 right-0 p-6" style={{ background: 'linear-gradient(to top, var(--bg) 60%, transparent)' }}>
          <motion.button
            whileHover={{ scale: canProceed() ? 1.02 : 1 }}
            whileTap={{ scale: canProceed() ? 0.98 : 1 }}
            onClick={() => canProceed() && setStep(step + 1)}
            disabled={!canProceed()}
            className={`w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              canProceed()
                ? 'bg-[#00c6d2] text-[#0b0b0b]'
                : ''
            }`}
            style={canProceed() ? {} : { background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            {t.continue}
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      )}

      {/* Verification Modal */}
      {createdProfile && (
        <VerificationFlow
          isOpen={showVerification}
          onClose={() => { setShowVerification(false); }}
          userProfile={createdProfile}
          onVerificationComplete={skipToHome}
        />
      )}
    </div>
  );
}

export default function Onboarding() {
  return <OnboardingInner />;
}
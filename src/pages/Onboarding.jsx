import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GenderSelect from '../components/onboarding/GenderSelect';
import DateOfBirthSelect from '../components/onboarding/DateOfBirthSelect';
import PhotoUploadStep from '../components/onboarding/PhotoUploadStep';
import VibesSelect from '../components/onboarding/VibesSelect';
import PartyTypeSelect from '../components/onboarding/PartyTypeSelect';
import WelcomeComplete from '../components/onboarding/WelcomeComplete';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    gender: '',
    date_of_birth: '',
    photos: [],
    vibes: [],
    party_types: []
  });
  const [loading, setLoading] = useState(false);

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
      case 0: return data.gender !== '';
      case 1: return data.date_of_birth !== '';
      case 2: return data.photos.length > 0;
      case 3: return data.vibes.length >= 2;
      case 4: return data.party_types.length >= 2;
      default: return true;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.UserProfile.create({
        user_id: user.id,
        display_name: user.full_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        photos: data.photos,
        vibes: data.vibes,
        party_types: data.party_types,
        city: '',
        radius_km: 10,
        onboarding_completed: true,
        total_stories_count: 0
      });
      navigate(createPageUrl('Home'));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const steps = [
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
    <WelcomeComplete onExplore={handleComplete} />
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
      {step < 5 && (
        <div className="px-6 mb-8">
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
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
      {step < 5 && (
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
            Continue
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      )}
    </div>
  );
}
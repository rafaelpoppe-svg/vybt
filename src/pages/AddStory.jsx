import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronLeft, Image as ImageIcon, X, Check, 
  Users, Sparkles, Lock, Loader2, Clock, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const visibilityOptions = [
  { id: 'group_only', label: 'Group Only', icon: Lock, desc: 'Only visible in the plan group chat' },
  { id: 'friends', label: 'Friends', icon: Users, desc: 'Visible to your friends' },
  { id: 'highlighted', label: 'Highlight to Everyone', icon: Sparkles, desc: 'Featured to all users (paid)', isPaid: true }
];

export default function AddStory() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedPlanId = urlParams.get('planId');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [media, setMedia] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlanId || '');
  const [visibility, setVisibility] = useState('friends');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  // Get user's joined plans
  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.id],
    queryFn: () => base44.entities.PlanParticipant.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 50),
  });

  const myPlanIds = myParticipations.map(p => p.plan_id);
  const myPlans = plans.filter(p => myPlanIds.includes(p.id));

  // Check if plan is active (started)
  const isPlanActive = (plan) => {
    if (!plan) return false;
    const now = new Date();
    const planDateTime = new Date(`${plan.date}T${plan.time}`);
    return now >= planDateTime;
  };

  // Filter to only show active plans
  const activePlans = myPlans.filter(isPlanActive);

  const handleMediaSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setMediaUrl(file_url);
      } catch (err) {
        console.error(err);
      }
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!mediaUrl || !selectedPlan) return;
    
    setSubmitting(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      await base44.entities.ExperienceStory.create({
        user_id: currentUser.id,
        plan_id: selectedPlan,
        media_url: mediaUrl,
        media_type: media?.type?.startsWith('video') ? 'video' : 'image',
        visibility: visibility,
        is_highlighted: visibility === 'highlighted',
        view_count: 0,
        expires_at: expiresAt.toISOString()
      });
      
      navigate(createPageUrl('Home'));
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-900"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-xl font-bold text-white">Add Story</h1>
        </div>
      </header>

      <main className="p-4 pb-32 space-y-6">
        {/* Info about posting */}
        <div className="p-3 rounded-xl bg-[#542b9b]/20 border border-[#542b9b]/30 flex items-start gap-3">
          <Clock className="w-5 h-5 text-[#542b9b] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300">
            You can only post experience stories during or after the plan starts. 
            Stories are visible based on your visibility choice.
          </p>
        </div>

        {/* Media Upload */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Photo or Video</label>
          <label className="block">
            {mediaUrl ? (
              <div className="relative aspect-[9/16] max-h-80 rounded-xl overflow-hidden mx-auto">
                <img src={mediaUrl} alt="Story" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMedia(null);
                    setMediaUrl('');
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            ) : (
              <div className="aspect-[9/16] max-h-80 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-gray-600 transition-colors mx-auto">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-[#00fea3] animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-gray-600" />
                    <span className="text-gray-500">Tap to add media</span>
                  </>
                )}
              </div>
            )}
            <input 
              type="file" 
              accept="image/*,video/*" 
              onChange={handleMediaSelect} 
              className="hidden" 
            />
          </label>
        </div>

        {/* Select Plan - Only active plans */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Which plan is this from?</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {activePlans.length > 0 ? (
              activePlans.map((plan) => (
                <motion.button
                  key={plan.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    selectedPlan === plan.id
                      ? 'border-[#00fea3] bg-[#00fea3]/10'
                      : 'border-gray-800 bg-gray-900'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#542b9b] to-[#00fea3]/50 flex items-center justify-center">
                    <span>🎉</span>
                  </div>
                  <span className={`font-medium ${
                    selectedPlan === plan.id ? 'text-[#00fea3]' : 'text-white'
                  }`}>
                    {plan.title}
                  </span>
                  {selectedPlan === plan.id && (
                    <Check className="w-5 h-5 text-[#00fea3] ml-auto" />
                  )}
                </motion.button>
              ))
            ) : myPlans.length > 0 ? (
              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Plans not started yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    You can post stories once your plans start at their scheduled time.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                You need to join a plan first to add stories
              </p>
            )}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Who can see this?</label>
          <div className="space-y-2">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setVisibility(option.id)}
                  className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    visibility === option.id
                      ? 'border-[#00fea3] bg-[#00fea3]/10'
                      : 'border-gray-800 bg-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    visibility === option.id ? 'text-[#00fea3]' : 'text-gray-400'
                  }`} />
                  <div className="text-left flex-1">
                    <p className={`font-medium ${
                      visibility === option.id ? 'text-[#00fea3]' : 'text-white'
                    }`}>
                      {option.label}
                      {option.isPaid && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-[#542b9b] text-[10px] text-white">
                          PAID
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                  {visibility === option.id && (
                    <Check className="w-5 h-5 text-[#00fea3]" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {selectedPlanData && (
          <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
            <p className="text-sm text-gray-400">
              This story will be tagged to:
            </p>
            <p className="text-white font-medium mt-1">
              {selectedPlanData.title} in {selectedPlanData.city}
            </p>
          </div>
        )}
      </main>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b] to-transparent">
        <Button
          onClick={handleSubmit}
          disabled={!mediaUrl || !selectedPlan || submitting}
          className={`w-full py-6 rounded-full font-bold text-lg ${
            mediaUrl && selectedPlan
              ? 'bg-[#00fea3] text-[#0b0b0b] hover:bg-[#00fea3]/90'
              : 'bg-gray-800 text-gray-500'
          }`}
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : visibility === 'highlighted' ? (
            'Share & Pay to Highlight'
          ) : (
            'Share Story'
          )}
        </Button>
      </div>
    </div>
  );
}
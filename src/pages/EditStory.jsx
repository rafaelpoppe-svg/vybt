import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, X, Loader2, AlertCircle, Sparkles, Users, Lock,
  Save, Trash2, MoreVertical, Eye, EyeOff, Wand2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AIReviewModal from '../components/story/AIReviewModal.jsx';

export default function EditStory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('id');

  const [currentUser, setCurrentUser] = useState(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('friends');
  const [showAIReview, setShowAIReview] = useState(false);
  const [aiReview, setAiReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => navigate(createPageUrl('Welcome')));
  }, []);

  const { data: story, isLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => {
      const result = await base44.entities.ExperienceStory.filter({ id: storyId });
      return result[0];
    },
    enabled: !!storyId
  });

  const { data: plan } = useQuery({
    queryKey: ['storyPlan', story?.plan_id],
    queryFn: () => base44.entities.PartyPlan.filter({ id: story.plan_id }),
    select: (data) => data[0],
    enabled: !!story?.plan_id
  });

  // Check ownership
  useEffect(() => {
    if (story && currentUser && story.user_id !== currentUser.id) {
      navigate(-1);
    }
  }, [story, currentUser]);

  // Initialize from story
  useEffect(() => {
    if (story) {
      setCaption(story.caption || '');
      setVisibility(story.visibility || 'friends');
    }
  }, [story]);

  const handleAIReview = async () => {
    if (!caption.trim()) return;
    setReviewLoading(true);
    
    try {
      const result = await base44.functions.invoke('reviewStoryCaption', {
        caption: caption,
        context: `Story for plan: ${plan?.title || 'Unknown'}`
      });
      
      setAiReview(result.data);
      setShowAIReview(true);
    } catch (error) {
      console.error('AI review failed:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ExperienceStory.update(storyId, {
        caption: caption,
        visibility: visibility
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['story', storyId]);
      navigate(-1);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ExperienceStory.delete(storyId);
    },
    onSuccess: () => {
      navigate(-1);
    }
  });

  if (isLoading || !story) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{background: 'var(--bg)'}}
      >
        <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
      </div>
    );
  }

  const visibilityOptions = [
    { id: 'friends', icon: Users, label: 'Friends Only' },
    { id: 'group_only', icon: Lock, label: 'Group Only' },
    { id: 'highlighted', icon: Sparkles, label: 'Highlighted' },
  ];

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: 'var(--bg)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-900 hover:bg-gray-800"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        <h1 className="text-lg font-bold text-white">Edit Story</h1>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-32">
        {/* Media Preview */}
        <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
          <div className="aspect-video bg-gray-800 relative">
            {story.media_type === 'video' ? (
              <video
                src={story.media_url}
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <img
                src={story.media_url}
                alt="Story"
                className="w-full h-full object-cover"
              />
            )}
            {story.thumbnail_url && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 text-xs text-white">
                {story.media_type === 'video' ? '🎬 Video' : '📷 Image'}
              </div>
            )}
          </div>
        </div>

        {/* Plan Info */}
        {plan && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#542b9b]/20 to-[#00c6d2]/20 border border-[#542b9b]/30">
            <p className="text-xs text-gray-400 mb-1">Associated Plan</p>
            <p className="text-white font-semibold">{plan.title}</p>
            <p className="text-xs text-gray-500 mt-1">{plan.city}</p>
          </div>
        )}

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption to your story..."
            maxLength={500}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:border-[#00c6d2] focus:outline-none resize-none h-24"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">{caption.length}/500</p>
            {caption.trim() && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAIReview}
                disabled={reviewLoading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#542b9b]/30 border border-[#542b9b] text-sm text-[#542b9b] hover:bg-[#542b9b]/50 transition-colors disabled:opacity-50"
              >
                {reviewLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                AI Review
              </motion.button>
            )}
          </div>
        </div>

        {/* Visibility Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Visibility</label>
          <div className="space-y-2">
            {visibilityOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setVisibility(opt.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    visibility === opt.id
                      ? 'border-[#00c6d2] bg-[#00c6d2]/10'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${visibility === opt.id ? 'text-[#00c6d2]' : 'text-gray-500'}`} />
                  <span className={visibility === opt.id ? 'text-[#00c6d2] font-medium' : 'text-gray-300'}>
                    {opt.label}
                  </span>
                  {visibility === opt.id && (
                    <Eye className="w-4 h-4 ml-auto text-[#00c6d2]" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Story Status */}
        <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
          <p className="text-xs text-gray-500 mb-2">Status</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Views</span>
              <span className="text-white font-medium">{story.view_count || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Posted</span>
              <span className="text-white font-medium">
                {new Date(story.created_date).toLocaleDateString('pt-PT')}
              </span>
            </div>
            {story.expires_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Expires</span>
                <span className="text-white font-medium">
                  {new Date(story.expires_at).toLocaleDateString('pt-PT')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/95 to-transparent border-t border-gray-800" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-full bg-gray-900 border border-gray-800 hover:border-red-500/30 hover:bg-gray-800"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-800">
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('Are you sure you want to delete this story?')) {
                    setDeleting(true);
                    deleteMutation.mutate();
                  }
                }}
                className="text-red-400 hover:text-red-300 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Story
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSaving(true);
              saveMutation.mutate();
            }}
            disabled={saveMutation.isPending || deleting}
            className="flex-1 py-4 rounded-full bg-[#00c6d2] text-[#0b0b0b] font-bold flex items-center justify-center gap-2 hover:bg-[#00c6d2]/90 disabled:opacity-50 transition-all"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* AI Review Modal */}
      <AIReviewModal
        isOpen={showAIReview}
        onClose={() => setShowAIReview(false)}
        review={aiReview}
        caption={caption}
        onApply={(suggestedCaption) => {
          setCaption(suggestedCaption);
          setShowAIReview(false);
        }}
      />
    </div>
  );
}
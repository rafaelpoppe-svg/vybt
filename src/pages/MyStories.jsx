import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Eye, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../components/common/LanguageContext';

export default function MyStories() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {}
    };
    getUser();
  }, []);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['myStories', currentUser?.id],
    queryFn: () => base44.entities.ExperienceStory.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['allPlans'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 100),
  });

  const plansMap = plans.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  return (
    <div className="min-h-screen" style={{background: 'var(--bg)'}}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-lg border-b border-gray-800 p-4 flex items-center gap-4"
        style={{background: 'var(--bg)', opacity: 0.95}}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-900"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        <h1 className="text-xl font-bold text-white">{t.myExperienceStories}</h1>
      </header>

      <main className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
          </div>
        ) : stories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {stories.map((story) => {
              const plan = plansMap[story.plan_id];
              return (
                <motion.div
                  key={story.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
                  className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer"
                >
                  <img
                    src={story.media_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {story.is_highlighted && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-[#542b9b]/80 backdrop-blur-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#00c6d2]" />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-medium text-sm truncate">
                      {plan?.title || t.unknownPlan}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-400 text-xs">
                        {format(new Date(story.created_date), 'MMM d')}
                      </span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Eye className="w-3 h-3" />
                        <span className="text-xs">{story.view_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{t.noStoriesYet}</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(createPageUrl('AddStory'))}
              className="px-6 py-2 rounded-full bg-[#00c6d2] text-[#0b0b0b] font-medium"
            >
              {t.addFirstStory}
            </motion.button>
          </div>
        )}
      </main>
    </div>
  );
}
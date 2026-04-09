import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

export default function ProfileStoryGrid({ stories, onStoryClick }) {
  const { t } = useLanguage();

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <span className="text-4xl">📸</span>
        <p className="text-gray-400 text-sm">{t.noStoriesYet}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {stories.map((story, i) => (
        <motion.button
          key={story.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onStoryClick(story)}
          className="relative aspect-square rounded-lg overflow-hidden group"
        >
          <img
            src={story.thumbnail_url || story.media_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {story.media_type === 'video' && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>
      ))}
    </div>
  );
}
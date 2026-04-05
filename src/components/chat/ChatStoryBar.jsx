import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Sparkles, Video } from 'lucide-react';
import { useLanguage } from '../components/common/LanguageContext';

const STORY_BORDER_COLORS = [
  ['#f43f5e', '#fb7185'],
  ['#a855f7', '#c084fc'],
  ['#3b82f6', '#60a5fa'],
  ['#f97316', '#fb923c'],
  ['#ec4899', '#f472b6'],
  ['#06b6d4', '#22d3ee'],
  ['#eab308', '#fbbf24'],
  ['#10b981', '#34d399'],
  ['#6366f1', '#818cf8'],
  ['#ef4444', '#f87171'],
];

function getColorForUser(userId) {
  if (!userId) return STORY_BORDER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return STORY_BORDER_COLORS[Math.abs(hash) % STORY_BORDER_COLORS.length];
}

function CircleStory({ story, user, isOwn, isAdd, onClick, isHappening }) {
  const colors = isOwn ? ['#00c6d2', '#542b9b'] : getColorForUser(story?.user_id);
  const {t} = useLanguage();
  if (isAdd) {
    return (
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        className="flex flex-col items-center gap-1.5 flex-shrink-0"
      >
        <div className="relative">
          {isHappening && (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ boxShadow: ['0 0 0 0px #00d4ff88', '0 0 0 8px #00d4ff00'] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
            />
          )}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center relative"
            style={{
              background: isHappening ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
              border: isHappening ? '2.5px solid #00d4ff' : '2.5px dashed #00c6d2',
            }}
          >
            {isHappening
              ? <Video className="w-6 h-6 text-[#00d4ff]" />
              : <Plus className="w-6 h-6 text-[#00c6d2]" />
            }
          </div>
        </div>
        <span className="text-[10px] text-gray-400 max-w-[64px] text-center leading-tight truncate">
          {isHappening ? t.live : t.add}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
    >
      <div
        className="w-16 h-16 rounded-full p-[2.5px]"
        style={{
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
          boxShadow: `0 0 12px ${colors[0]}55`,
        }}
      >
        <div 
          className="w-full h-full rounded-full p-[2px] overflow-hidden relative"
          style={{background: 'var(--bg)'}}
        >
          {story?.media_url ? (
            <>
              <img
                src={story.media_type === 'video' && story.thumbnail_url ? story.thumbnail_url : story.media_url}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
              {story.media_type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full">
                  <div className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />
                  </div>
                </div>
              )}
            </>
          ) : user?.photos?.[0] ? (
            <img
              src={user.photos[0]}
              alt={user.display_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors[0]}33, ${colors[1]}33)` }}>
              <span className="text-white font-bold text-lg">
                {user?.display_name?.[0] || '?'}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 max-w-[64px]">
        {story?.is_highlighted && <Sparkles className="w-2.5 h-2.5 text-yellow-400 flex-shrink-0" />}
        <span className="text-[10px] text-gray-300 truncate leading-tight">
          {isOwn ? t.you : (user?.display_name || t.user)}
        </span>
      </div>
    </motion.button>
  );
}

export default function ChatStoryBar({
  stories = [],
  profilesMap = {},
  currentUserId,
  onStoryClick,
  onAddStory,
  canPost = false,
  isHappening = false,
}) {
  const ownStories = stories.filter(s => s.user_id === currentUserId);
  const otherStories = stories.filter(s => s.user_id !== currentUserId);
  const shuffled = [...otherStories].sort(() => Math.random() - 0.5);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-white font-bold text-base tracking-wide">✨ Experiences</h2>
        <span className="text-gray-500 text-xs">{stories.length} stories</span>
      </div>

      <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-1" data-hscroll="true">
        {canPost && (
          <CircleStory isAdd onClick={onAddStory} isHappening={isHappening} />
        )}

        {ownStories.map(story => (
          <CircleStory
            key={story.id}
            story={story}
            user={profilesMap[story.user_id]}
            isOwn
            onClick={() => onStoryClick(story)}
          />
        ))}

        {shuffled.map((story, idx) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 280, damping: 22 }}
          >
            <CircleStory
              story={story}
              user={profilesMap[story.user_id]}
              onClick={() => onStoryClick(story)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
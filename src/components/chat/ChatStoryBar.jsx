import React from 'react';
import StoryCard from '../feed/StoryCard';

export default function ChatStoryBar({ 
  stories, 
  profilesMap, 
  currentUserId,
  onStoryClick, 
  onAddStory,
  canPost = false
}) {
  // Separate own stories and others
  const ownStories = stories.filter(s => s.user_id === currentUserId);
  const otherStories = stories.filter(s => s.user_id !== currentUserId);

  // Shuffle other stories for random order
  const shuffledOthers = [...otherStories].sort(() => Math.random() - 0.5);

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-4">
      {/* Add story button - only if plan is active */}
      {canPost && (
        <StoryCard
          isAdd
          onClick={onAddStory}
          size="md"
        />
      )}

      {/* Own stories first */}
      {ownStories.map((story, index) => (
        <StoryCard
          key={story.id}
          user={profilesMap[story.user_id]}
          story={story}
          isOwn
          isHighlighted={story.is_highlighted}
          onClick={() => onStoryClick(story)}
          size="md"
        />
      ))}

      {/* Other stories with random colors */}
      {shuffledOthers.map((story, index) => (
        <StoryCard
          key={story.id}
          user={profilesMap[story.user_id]}
          story={story}
          colorIndex={index}
          isHighlighted={story.is_highlighted}
          currentUserId={currentUserId}
          onClick={() => onStoryClick(story)}
          size="md"
        />
      ))}
    </div>
  );
}
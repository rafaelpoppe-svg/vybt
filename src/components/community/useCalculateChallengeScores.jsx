import { useMemo } from 'react';

export function useCalculateChallengeScores(stories, storyReactions) {
  return useMemo(() => {
    const scoreMap = {};

    // Group stories by user
    stories.forEach(story => {
      if (!scoreMap[story.user_id]) {
        scoreMap[story.user_id] = {
          user_id: story.user_id,
          story_count: 0,
          view_points: 0,
          reaction_points: 0,
          total_points: 0,
          stories: [],
        };
      }

      scoreMap[story.user_id].stories.push(story);
      scoreMap[story.user_id].story_count += 1;

      // 5 points per story submitted
      scoreMap[story.user_id].total_points += 5;

      // 1 point per 10 views
      const viewPoints = Math.floor((story.view_count || 0) / 10);
      scoreMap[story.user_id].view_points += viewPoints;
      scoreMap[story.user_id].total_points += viewPoints;
    });

    // Add reaction points
    storyReactions?.forEach(reaction => {
      const storyWithUser = stories.find(s => s.id === reaction.story_id);
      if (storyWithUser && scoreMap[storyWithUser.user_id]) {
        scoreMap[storyWithUser.user_id].reaction_points += 2; // 2 points per reaction
        scoreMap[storyWithUser.user_id].total_points += 2;
      }
    });

    // Calculate engagement multiplier (1.0 to 1.5x)
    Object.values(scoreMap).forEach(score => {
      const engagement = (score.view_points + score.reaction_points) / (score.story_count * 10);
      score.engagement_multiplier = Math.min(1.5, 1 + engagement * 0.5);
      score.total_points = Math.round(score.total_points * score.engagement_multiplier);
    });

    // Sort by total points
    return Object.values(scoreMap).sort((a, b) => b.total_points - a.total_points);
  }, [stories, storyReactions]);
}
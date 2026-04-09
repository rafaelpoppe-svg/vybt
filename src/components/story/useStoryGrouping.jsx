import { useMemo } from 'react';

/**
 * Hook para agrupar stories por utilizador/plano e fornecer lógica de navegação
 * Estrutura resultante: 
 * [
 *   { type: 'plan', plan_id: '...', planName: '...', stories: [...] },
 *   { type: 'friend', user_id: '...', userName: '...', stories: [...] },
 *   { type: 'highlighted', user_id: '...', userName: '...', stories: [...] }
 * ]
 */
export function useStoryGrouping(allStories, userProfiles, plans, currentUser, friendships) {
  const groupedStories = useMemo(() => {
    if (!allStories || !userProfiles || !plans || !currentUser) return [];

    const friendIds = new Set(
      (friendships || [])
        .filter(f => f.user_id === currentUser.id && f.status === 'accepted')
        .map(f => f.friend_id)
    );

    const profilesMap = userProfiles.reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {});

    const groups = [];
    const processedGroupKeys = new Set();

    // Agrupar por Plano (plan_id)
    const storiesByPlan = {};
    allStories.forEach(story => {
      
      const key = `plan_${story.plan_id}`;
      if (!storiesByPlan[key]) storiesByPlan[key] = [];
      storiesByPlan[key].push(story);
    });

    Object.entries(storiesByPlan).forEach(([key, stories]) => {
      const planId = stories[0].plan_id;
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        groups.push({
          type: 'plan',
          plan_id: planId,
          planName: plan.title,
          planCity: plan.city,
          planThemeColor: plan.theme_color,
          planImage: plan.group_image || plan.cover_image,
          stories: stories.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        });
        processedGroupKeys.add(key);
      }
    });

    // Agrupar por Utilizador (Amigos)
    const storiesByFriendUser = {};
    allStories.forEach(story => {
      if (!friendIds.has(story.user_id)) return;

      const key = `friend_${story.user_id}`;
      if (!storiesByFriendUser[key]) storiesByFriendUser[key] = [];
      storiesByFriendUser[key].push(story);
    });

    Object.entries(storiesByFriendUser).forEach(([key, stories]) => {
      const userId = stories[0].user_id;
      const userProfile = profilesMap[userId];
      if (userProfile) {
        groups.push({
          type: 'friend',
          user_id: userId,
          userName: userProfile.display_name,
          userPhoto: userProfile.photos?.[0],
          stories: stories.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        });
        processedGroupKeys.add(key);
      }
    });

    // Agrupar por Utilizador (Highlighted/Promovidos)
    const storiesByHighlightedUser = {};
    allStories.forEach(story => {
      if (!story.is_highlighted) return;
      if (friendIds.has(story.user_id)) return; // Já foram processados como amigos

      const key = `highlighted_${story.user_id}`;
      if (!storiesByHighlightedUser[key]) storiesByHighlightedUser[key] = [];
      storiesByHighlightedUser[key].push(story);
    });

    Object.entries(storiesByHighlightedUser).forEach(([key, stories]) => {
      const userId = stories[0].user_id;
      const userProfile = profilesMap[userId];
      if (userProfile) {
        groups.push({
          type: 'highlighted',
          user_id: userId,
          userName: userProfile.display_name,
          userPhoto: userProfile.photos?.[0],
          stories: stories.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        });
        processedGroupKeys.add(key);
      }
    });

    return groups;
  }, [allStories, userProfiles, plans, currentUser, friendships]);

  const findStoryPosition = (storyId) => {
    for (let groupIdx = 0; groupIdx < groupedStories.length; groupIdx++) {
      const group = groupedStories[groupIdx];
      if (group.type !== 'friend') continue;
      const storyIdx = group.stories.findIndex(s => s.id === storyId);
      if (storyIdx !== -1) {
        return { groupIndex: groupIdx, storyIndex: storyIdx, group };
      }
    }
    for (let groupIdx = 0; groupIdx < groupedStories.length; groupIdx++) {
      const group = groupedStories[groupIdx];
      if (group.type === 'friend') continue;
      const storyIdx = group.stories.findIndex(s => s.id === storyId);
      if (storyIdx !== -1) {
        return { groupIndex: groupIdx, storyIndex: storyIdx, group };
      }
    }
    return null;
  };
  /**
   * Obtém a história atual baseado nos índices
   */
  const getStoryAt = (groupIndex, storyIndex) => {
    if (groupIndex < 0 || groupIndex >= groupedStories.length) return null;
    const group = groupedStories[groupIndex];
    if (storyIndex < 0 || storyIndex >= group.stories.length) return null;
    return group.stories[storyIndex];
  };

  /**
   * Obtém informações de contexto do grupo (para renderização)
   */
  const getGroupContext = (groupIndex) => {
    if (groupIndex < 0 || groupIndex >= groupedStories.length) return null;
    return groupedStories[groupIndex];
  };

  return {
    groupedStories,
    findStoryPosition,
    getStoryAt,
    getGroupContext
  };
}
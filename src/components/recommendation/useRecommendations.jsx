import { useMemo } from 'react';

// Map party tags to vibes for cross-matching
const tagToVibeMap = {
  'Techno': ['Techno', 'Hard Techno', 'EDM'],
  'Rooftop Afternoon': ['House', 'Disco', 'Pop'],
  'Rooftop Night': ['House', 'Techno', 'EDM'],
  'Bar': ['Pop', 'Rock', '80s Songs', 'Disco'],
  'Luxury': ['House', 'Disco', 'Pop'],
  'House Party': ['Reggaeton', 'Trap', 'Pop', 'EDM'],
  'University': ['Reggaeton', 'Pop', 'EDM', 'Trap'],
  'Commercial': ['Reggaeton', 'Pop', 'Trap', 'Afrobeats'],
  'Latin': ['Reggaeton', 'Brazilian Funk', 'Afrobeats'],
  'EDM': ['EDM', 'House', 'Techno'],
  'Hard Techno': ['Hard Techno', 'Techno']
};

const partyTypeToTag = {
  'rooftop_afternoon': 'Rooftop Afternoon',
  'rooftop_night': 'Rooftop Night',
  'techno_parties': 'Techno',
  'simple_bar': 'Bar',
  'luxury_parties': 'Luxury',
  'house_parties': 'House Party',
  'university_parties': 'University',
  'commercial_parties': 'Commercial'
};

function calculateVibeMatch(planTags = [], userVibes = []) {
  if (!planTags.length || !userVibes.length) return 0;
  
  let matchCount = 0;
  
  for (const tag of planTags) {
    if (userVibes.some(vibe => tag.toLowerCase().includes(vibe.toLowerCase()))) {
      matchCount += 2;
      continue;
    }
    const relatedVibes = tagToVibeMap[tag] || [];
    if (relatedVibes.some(vibe => userVibes.includes(vibe))) {
      matchCount += 1.5;
    }
  }
  
  if (userVibes.includes('Curious to every style')) {
    matchCount += 1;
  }
  
  return Math.min(matchCount / planTags.length * 50, 50);
}

function calculatePartyTypeMatch(planTags = [], userPartyTypes = []) {
  if (!planTags.length || !userPartyTypes.length) return 0;
  
  let matchCount = 0;
  
  for (const partyType of userPartyTypes) {
    const tagName = partyTypeToTag[partyType];
    if (tagName && planTags.some(tag => 
      tag.toLowerCase().includes(tagName.toLowerCase()) ||
      tagName.toLowerCase().includes(tag.toLowerCase())
    )) {
      matchCount++;
    }
  }
  
  return (matchCount / userPartyTypes.length) * 30;
}

function calculateFriendScore(planId, friendIds = [], allParticipants = []) {
  if (!friendIds.length) return 0;
  
  const planParticipants = allParticipants.filter(p => p.plan_id === planId);
  const friendsGoing = planParticipants.filter(p => friendIds.includes(p.user_id));
  
  if (friendsGoing.length === 0) return 0;
  if (friendsGoing.length >= 3) return 15;
  if (friendsGoing.length >= 2) return 10;
  return 5;
}

function calculatePastAttendanceScore(planTags = [], pastPlans = []) {
  if (!pastPlans.length || !planTags.length) return 0;
  
  const pastTags = pastPlans.flatMap(p => p.tags || []);
  const tagFrequency = {};
  
  for (const tag of pastTags) {
    tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
  }
  
  let score = 0;
  for (const tag of planTags) {
    if (tagFrequency[tag]) {
      score += Math.min(tagFrequency[tag] * 2, 5);
    }
  }
  
  return Math.min(score, 15);
}

function calculateLocationScore(planCity, userCity) {
  if (!planCity || !userCity) return 0;
  if (planCity.toLowerCase() === userCity.toLowerCase()) return 10;
  return 0;
}

export function useRecommendations({
  plans = [],
  userProfile = {},
  friendIds = [],
  pastPlanIds = [],
  allParticipants = [],
  allPlans = []
}) {
  return useMemo(() => {
    if (!plans.length) return [];
    
    const pastPlans = allPlans.filter(p => pastPlanIds.includes(p.id));
    
    const scoredPlans = plans.map(plan => {
      const scores = {
        vibes: calculateVibeMatch(plan.tags, userProfile?.vibes),
        partyType: calculatePartyTypeMatch(plan.tags, userProfile?.party_types),
        friends: calculateFriendScore(plan.id, friendIds, allParticipants),
        pastAttendance: calculatePastAttendanceScore(plan.tags, pastPlans),
        location: calculateLocationScore(plan.city, userProfile?.city)
      };
      
      const highlightBonus = plan.is_highlighted ? 5 : 0;
      const popularityBonus = Math.min((plan.view_count || 0) / 100, 5);
      
      const totalScore = 
        scores.vibes + 
        scores.partyType + 
        scores.friends + 
        scores.pastAttendance + 
        scores.location +
        highlightBonus +
        popularityBonus;
      
      const reasons = [];
      if (scores.vibes > 20) reasons.push('vibes');
      if (scores.partyType > 15) reasons.push('party_type');
      if (scores.friends > 0) reasons.push('friends');
      if (scores.location > 0) reasons.push('location');
      
      return {
        ...plan,
        matchScore: Math.round(totalScore),
        matchReasons: reasons,
        scoreBreakdown: scores
      };
    });
    
    return scoredPlans.sort((a, b) => b.matchScore - a.matchScore);
  }, [plans, userProfile, friendIds, pastPlanIds, allParticipants, allPlans]);
}
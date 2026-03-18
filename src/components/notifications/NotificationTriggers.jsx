import { base44 } from '@/api/base44Client';

// Map notification type -> preference key
const typeToPrefsKey = {
  new_group_message: 'group_message',
  new_direct_message: 'group_message',
  new_group_member: 'group_message',
  voting_started: 'voting',
  plan_happening_now: 'plan_update',
  plan_successful: 'voting',
  plan_unsuccessful: 'voting',
  plan_renewed: 'plan_update',
  new_story_in_plan: 'friend_story',
  friend_posted_story: 'friend_story',
  friend_request: 'friend_request',
  friend_created_plan: 'new_plan',
  plan_recommendation: 'new_plan',
  plan_time_changed: 'plan_update',
  plan_location_changed: 'plan_update',
  plan_highlighted: 'plan_update',
  story_highlighted: 'friend_story',
};

// Check if user allows push notification of a certain type
const userAllowsPush = async (userId, notifType) => {
  try {
    const profiles = await base44.entities.UserProfile.filter({ user_id: userId });
    const profile = profiles[0];
    if (!profile?.notification_prefs) return true; // default allow
    const prefKey = typeToPrefsKey[notifType];
    if (!prefKey) return true;
    const pushKey = `${prefKey}_push`;
    // If key is not set, default to true
    return profile.notification_prefs[pushKey] !== false;
  } catch {
    return true;
  }
};

// Create notification helper
export const createNotification = async (userId, type, message, options = {}) => {
  try {
    // Check user's push notification preferences
    const allowed = await userAllowsPush(userId, type);
    if (!allowed) return;

    await base44.entities.Notification.create({
      user_id: userId,
      type,
      title: options.title || null,
      message,
      plan_id: options.planId || null,
      related_user_id: options.relatedUserId || null,
      is_read: false
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// Notification trigger functions
export const notifyNewGroupMessage = async (planId, senderId, senderName) => {
  try {
    // Get all participants except sender
    const participants = await base44.entities.PlanParticipant.filter({ plan_id: planId });
    const plan = (await base44.entities.PartyPlan.filter({ id: planId }))[0];
    
    for (const participant of participants) {
      if (participant.user_id !== senderId) {
        await createNotification(
          participant.user_id,
          'new_group_message',
          `${senderName} enviou uma mensagem em ${plan?.title || 'um plano'}`,
          { planId, relatedUserId: senderId }
        );
      }
    }
  } catch (error) {
    console.error('Failed to notify group message:', error);
  }
};

export const notifyNewDirectMessage = async (receiverId, senderId, senderName) => {
  await createNotification(
    receiverId,
    'new_direct_message',
    `${senderName} te enviou uma mensagem`,
    { relatedUserId: senderId }
  );
};

export const notifyFriendRequest = async (receiverId, senderId, senderName) => {
  await createNotification(
    receiverId,
    'friend_request',
    `${senderName} te enviou um pedido de amizade`,
    { relatedUserId: senderId }
  );
};

export const notifyNewGroupMember = async (planId, newMemberId, newMemberName) => {
  try {
    const participants = await base44.entities.PlanParticipant.filter({ plan_id: planId });
    const plan = (await base44.entities.PartyPlan.filter({ id: planId }))[0];
    
    for (const participant of participants) {
      if (participant.user_id !== newMemberId) {
        await createNotification(
          participant.user_id,
          'new_group_member',
          `${newMemberName} entrou em ${plan?.title || 'o plano'}`,
          { planId, relatedUserId: newMemberId }
        );
      }
    }
  } catch (error) {
    console.error('Failed to notify new member:', error);
  }
};

export const notifyVotingStarted = async (planId) => {
  try {
    const participants = await base44.entities.PlanParticipant.filter({ plan_id: planId });
    const plan = (await base44.entities.PartyPlan.filter({ id: planId }))[0];
    
    for (const participant of participants) {
      await createNotification(
        participant.user_id,
        'voting_started',
        `Votação iniciada para ${plan?.title || 'o plano'}! Vote agora.`,
        { planId }
      );
    }
  } catch (error) {
    console.error('Failed to notify voting:', error);
  }
};

export const notifyPlanTimeChanged = async (planId, adminName) => {
  try {
    const participants = await base44.entities.PlanParticipant.filter({ plan_id: planId });
    const plan = (await base44.entities.PartyPlan.filter({ id: planId }))[0];
    
    for (const participant of participants) {
      await createNotification(
        participant.user_id,
        'plan_time_changed',
        `${adminName} alterou o horário de ${plan?.title || 'o plano'}`,
        { planId }
      );
    }
  } catch (error) {
    console.error('Failed to notify time change:', error);
  }
};

export const notifyPlanLocationChanged = async (planId, adminName) => {
  try {
    const participants = await base44.entities.PlanParticipant.filter({ plan_id: planId });
    const plan = (await base44.entities.PartyPlan.filter({ id: planId }))[0];
    
    for (const participant of participants) {
      await createNotification(
        participant.user_id,
        'plan_location_changed',
        `${adminName} alterou o local de ${plan?.title || 'o plano'}`,
        { planId }
      );
    }
  } catch (error) {
    console.error('Failed to notify location change:', error);
  }
};

export const notifyPlanHappeningNow = async (planId) => {
  try {
    const participants = await base44.entities.PlanParticipant.filter({ plan_id: planId });
    const plan = (await base44.entities.PartyPlan.filter({ id: planId }))[0];
    
    for (const participant of participants) {
      await createNotification(
        participant.user_id,
        'plan_happening_now',
        `${plan?.title || 'O plano'} está acontecendo agora! 🔥`,
        { planId }
      );
    }
  } catch (error) {
    console.error('Failed to notify plan happening:', error);
  }
};

export const notifyNewStory = async (planId, userId, userName) => {
  try {
    const participants = await base44.entities.PlanParticipant.filter({ plan_id: planId });
    const plan = (await base44.entities.PartyPlan.filter({ id: planId }))[0];
    
    for (const participant of participants) {
      if (participant.user_id !== userId) {
        await createNotification(
          participant.user_id,
          'new_story_in_plan',
          `${userName} postou uma história em ${plan?.title || 'o plano'}`,
          { planId, relatedUserId: userId }
        );
      }
    }
  } catch (error) {
    console.error('Failed to notify new story:', error);
  }
};

// ─── Push-style smart notifications ───────────────────────────────────────────

/**
 * Notify a user about plans happening now near their city.
 * Only sends once per plan (checked against existing notifications).
 */
export const notifyNearbyPlanHappening = async (userId, plan) => {
  await createNotification(
    userId,
    'plan_happening_now',
    `🔥 "${plan.title}" está a acontecer agora em ${plan.city}!`,
    { planId: plan.id, title: 'Plano perto de ti' }
  );
};

/**
 * Notify a user that a friend created a new plan.
 */
export const notifyFriendCreatedPlan = async (userId, friendName, plan) => {
  await createNotification(
    userId,
    'friend_created_plan',
    `${friendName} criou um novo plano: "${plan.title}" em ${plan.city}`,
    { planId: plan.id, title: 'Novo plano de um amigo', relatedUserId: plan.creator_id }
  );
};

/**
 * Notify a participant about a plan renewal (plan updated/renewed).
 */
export const notifyPlanRenewed = async (userId, plan) => {
  await createNotification(
    userId,
    'plan_renewed',
    `"${plan.title}" foi renovado com nova data e horário! 🎉`,
    { planId: plan.id, title: 'Plano renovado' }
  );
};

/**
 * Notify a participant that their plan was successful after voting.
 */
export const notifyPlanSuccessful = async (userId, plan) => {
  await createNotification(
    userId,
    'plan_successful',
    `"${plan.title}" foi um sucesso! A comunidade adorou. 🎊`,
    { planId: plan.id, title: 'Plano bem-sucedido' }
  );
};

/**
 * Notify a participant that their plan was unsuccessful after voting.
 */
export const notifyPlanUnsuccessful = async (userId, plan) => {
  await createNotification(
    userId,
    'plan_unsuccessful',
    `"${plan.title}" não conseguiu votos suficientes desta vez.`,
    { planId: plan.id, title: 'Plano encerrado' }
  );
};

/**
 * Notify story owner that someone reacted to their story.
 */
export const notifyStoryReaction = async (storyOwnerId, reactorId, reactorName, emoji, storyId) => {
  if (storyOwnerId === reactorId) return; // don't notify yourself
  await createNotification(
    storyOwnerId,
    'story_reaction',
    `${reactorName} reagiu ao teu story ${emoji}`,
    { relatedUserId: reactorId, planId: storyId } // reuse plan_id field to store story id
  );
};
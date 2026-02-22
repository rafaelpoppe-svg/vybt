import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  notifyNearbyPlanHappening,
  notifyFriendCreatedPlan,
  createNotification,
} from './NotificationTriggers';

/**
 * Fires smart in-app "push" notifications for:
 *  1. Plans happening now near the user's city (that the user has NOT joined)
 *  2. New plans created by friends (in the last 24h)
 *  3. Plan updates (time/location) for plans the user participates in
 *     — already handled by notifyPlanTimeChanged / notifyPlanLocationChanged in AdminEditModal
 */
export function usePushNotifications({ currentUser, userCity, plans = [], friendIds = [], myParticipations = [] }) {
  // Track which notifications we've already fired this session to avoid duplicates
  const firedRef = useRef(new Set());

  useEffect(() => {
    if (!currentUser?.id || !userCity || plans.length === 0) return;

    const run = async () => {
      // Fetch existing notifications for this user so we don't double-send
      let existingPlanNotifIds = new Set();
      try {
        const existing = await base44.entities.Notification.filter({ user_id: currentUser.id });
        existing.forEach(n => {
          if (n.plan_id) existingPlanNotifIds.add(`${n.type}:${n.plan_id}`);
        });
      } catch (e) {}

      const myPlanIds = myParticipations.map(p => p.plan_id);

      for (const plan of plans) {
        if (plan.city !== userCity) continue;

        const alreadyJoined = myPlanIds.includes(plan.id);

        // ── 1. Plan happening now — notify PARTICIPANTS ────────────────────
        if (plan.status === 'happening' && alreadyJoined) {
          const key = `plan_happening_now_joined:${plan.id}`;
          if (!existingPlanNotifIds.has(`plan_happening_now:${plan.id}`) && !firedRef.current.has(key)) {
            firedRef.current.add(key);
            await createNotification(
              currentUser.id,
              'plan_happening_now',
              `🔵 "${plan.title}" está acontecendo agora! Poste o teu Experience Story!`,
              { planId: plan.id, title: 'Plano ao vivo!' }
            );
          }
        }

        // ── 2. Nearby plan happening now (not joined) ──────────────────────
        if (plan.status === 'happening' && !alreadyJoined) {
          const key = `plan_happening_now:${plan.id}`;
          if (!existingPlanNotifIds.has(key) && !firedRef.current.has(key)) {
            firedRef.current.add(key);
            await notifyNearbyPlanHappening(currentUser.id, plan);
          }
        }

        // ── 2. New plan by a friend (created in the last 24h) ──────────────
        if (plan.creator_id && friendIds.includes(plan.creator_id)) {
          const createdAt = new Date(plan.created_date);
          const hoursSince = (Date.now() - createdAt.getTime()) / 1000 / 3600;
          if (hoursSince <= 24) {
            const key = `friend_created_plan:${plan.id}`;
            if (!existingPlanNotifIds.has(key) && !firedRef.current.has(key)) {
              firedRef.current.add(key);
              // Fetch friend's display name
              try {
                const profiles = await base44.entities.UserProfile.filter({ user_id: plan.creator_id });
                const friendName = profiles[0]?.display_name || 'Um amigo';
                await notifyFriendCreatedPlan(currentUser.id, friendName, plan);
              } catch (e) {}
            }
          }
        }
      }
    };

    run();
  // Re-run whenever plans list changes (e.g., after refresh)
  }, [currentUser?.id, userCity, plans.length, friendIds.length, myParticipations.length]);
}
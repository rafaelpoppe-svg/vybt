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
export function usePushNotifications({ currentUser, userCity, plans = [], friendIds = [], myParticipations = [], userProfile = null }) {
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

      // ── Plan reminders (1 day / 1 hour before) ────────────────────────────
      const reminderPrefs = userProfile?.notification_prefs || {};
      for (const planId of myPlanIds) {
        const plan = plans.find(p => p.id === planId);
        if (!plan || plan.status === 'ended' || plan.status === 'terminated') continue;
        const startTime = new Date(`${plan.date}T${plan.time}`);
        const now = new Date();
        const msUntil = startTime - now;

        // 1 day before: window between 24h and 23h
        if (reminderPrefs.plan_reminder_1day) {
          const key = `reminder_1day:${plan.id}`;
          if (msUntil > 0 && msUntil <= 24 * 3600 * 1000 && msUntil > 23 * 3600 * 1000) {
            if (!existingPlanNotifIds.has(`plan_reminder_1day:${plan.id}`) && !firedRef.current.has(key)) {
              firedRef.current.add(key);
              await createNotification(
                currentUser.id,
                'plan_happening_now',
                `📅 Amanhã tens o plano "${plan.title}"! Não te esqueças.`,
                { planId: plan.id, title: 'Lembrete — amanhã' }
              );
            }
          }
        }

        // 1 hour before: window between 60min and 50min
        if (reminderPrefs.plan_reminder_1hour) {
          const key = `reminder_1hour:${plan.id}`;
          if (msUntil > 0 && msUntil <= 60 * 60 * 1000 && msUntil > 50 * 60 * 1000) {
            if (!existingPlanNotifIds.has(`plan_reminder_1hour:${plan.id}`) && !firedRef.current.has(key)) {
              firedRef.current.add(key);
              await createNotification(
                currentUser.id,
                'plan_happening_now',
                `⏰ O plano "${plan.title}" começa em 1 hora! Prepara-te!`,
                { planId: plan.id, title: 'Lembrete — 1 hora' }
              );
            }
          }
        }
      }

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

        // ── 3. New plan by a friend (created in the last 24h) ──────────────
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
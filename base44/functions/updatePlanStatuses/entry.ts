import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allPlans = await base44.asServiceRole.entities.PartyPlan.list('-created_date', 200);
    const now = new Date();

    let updated = 0;

    for (const plan of allPlans) {
      if (!['upcoming', 'happening'].includes(plan.status)) continue;
      if (!plan.date || !plan.end_time) continue;

      // Build end datetime from plan date + end_time
      const endDateTime = new Date(`${plan.date}T${plan.end_time}:00`);
      if (isNaN(endDateTime.getTime())) continue;

      // If end time has passed and plan is happening → move to voting
      if (now > endDateTime && plan.status === 'happening') {
        const votingEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        await base44.asServiceRole.entities.PartyPlan.update(plan.id, {
          status: 'voting',
          voting_ends_at: votingEndsAt,
        });
        updated++;
        continue;
      }

      // If start time has passed and plan is upcoming → check participants before moving to happening
      if (!plan.time) continue;
      const startDateTime = new Date(`${plan.date}T${plan.time}:00`);
      if (!isNaN(startDateTime.getTime()) && now > startDateTime && plan.status === 'upcoming') {
        // Layer 3: require at least 3 confirmed participants (going) to become "happening"
        const participants = await base44.asServiceRole.entities.PlanParticipant.filter({ plan_id: plan.id });
        const goingCount = participants.filter(p => p.status === 'going').length;
        if (goingCount < 3) {
          // Not enough people — auto-terminate instead of happening
          await base44.asServiceRole.entities.PartyPlan.update(plan.id, {
            status: 'terminated',
            terminated_at: now.toISOString(),
          });
        } else {
          await base44.asServiceRole.entities.PartyPlan.update(plan.id, { status: 'happening' });
        }
        updated++;
      }
    }

    return Response.json({ updated, message: `Updated ${updated} plan(s)` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
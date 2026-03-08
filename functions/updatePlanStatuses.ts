import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allPlans = await base44.asServiceRole.entities.PartyPlan.list('-created_date', 200);
    const now = new Date();

    // Build today's date string (YYYY-MM-DD) in UTC
    const todayStr = now.toISOString().slice(0, 10);

    let updated = 0;

    for (const plan of allPlans) {
      if (!['upcoming', 'happening'].includes(plan.status)) continue;
      if (!plan.date || !plan.end_time) continue;

      // Build end datetime from plan date + end_time (treat as local time, assume UTC for simplicity)
      const endDateTimeStr = `${plan.date}T${plan.end_time}:00`;
      const endDateTime = new Date(endDateTimeStr);

      if (isNaN(endDateTime.getTime())) continue;

      // If end time has passed, move to voting
      if (now > endDateTime && plan.status === 'happening') {
        const votingEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        await base44.asServiceRole.entities.PartyPlan.update(plan.id, {
          status: 'voting',
          voting_ends_at: votingEndsAt,
        });
        updated++;
        continue;
      }

      // If plan date/time has passed and still upcoming → move to happening
      if (!plan.time) continue;
      const startDateTimeStr = `${plan.date}T${plan.time}:00`;
      const startDateTime = new Date(startDateTimeStr);
      if (!isNaN(startDateTime.getTime()) && now > startDateTime && plan.status === 'upcoming') {
        await base44.asServiceRole.entities.PartyPlan.update(plan.id, { status: 'happening' });
        updated++;
      }
    }

    return Response.json({ updated, message: `Updated ${updated} plan(s)` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
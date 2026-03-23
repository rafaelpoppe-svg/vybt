import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role to run without user auth (called by scheduler)
    const allPlans = await base44.asServiceRole.entities.PartyPlan.list('-created_date', 200);

    const now = new Date();
    const terminated = allPlans.filter(p => {
      if (p.status !== 'terminated' || !p.terminated_at) return false;
      const diff = now - new Date(p.terminated_at);
      return diff >= 24 * 60 * 60 * 1000;
    });

    if (!terminated.length) {
      return Response.json({ deleted: 0, message: 'No plans to clean up' });
    }

    let deleted = 0;
    for (const plan of terminated) {
      const [participants, messages, stories] = await Promise.all([
        base44.asServiceRole.entities.PlanParticipant.filter({ plan_id: plan.id }),
        base44.asServiceRole.entities.ChatMessage.filter({ plan_id: plan.id, message_type: 'group' }),
        base44.asServiceRole.entities.ExperienceStory.filter({ plan_id: plan.id }),
      ]);

      await Promise.all([
        ...participants.map(p => base44.asServiceRole.entities.PlanParticipant.delete(p.id)),
        ...messages.map(m => base44.asServiceRole.entities.ChatMessage.delete(m.id)),
        ...stories.map(s => base44.asServiceRole.entities.ExperienceStory.delete(s.id)),
      ]);

      await base44.asServiceRole.entities.PartyPlan.delete(plan.id);
      deleted++;
    }

    return Response.json({ deleted, message: `Deleted ${deleted} terminated plan(s)` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
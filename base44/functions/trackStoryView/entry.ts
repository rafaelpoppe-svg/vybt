import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { story_id } = await req.json();
    if (!story_id) return Response.json({ error: 'Missing story_id' }, { status: 400 });

    const stories = await base44.asServiceRole.entities.ExperienceStory.filter({ id: story_id });
    const story = stories[0];
    if (!story) return Response.json({ ok: false });

    // Skip if already viewed by this user
    if (story.viewed_by?.includes(user.id)) return Response.json({ ok: true });

    await base44.asServiceRole.entities.ExperienceStory.update(story.id, {
      view_count: (story.view_count || 0) + 1,
      viewed_by: [...(story.viewed_by || []), user.id],
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
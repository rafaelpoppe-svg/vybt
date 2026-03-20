import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both direct call {story_id, image_url} and entity automation payload {data: {...}}
    const story = body.data || body;
    const story_id = story.id || body.story_id;
    const image_url = story.media_url || body.image_url;

    if (!story_id || !image_url) {
      return Response.json({ error: 'Missing story_id or image_url' }, { status: 400 });
    }

    // Only moderate images for now (video moderation can be added later)
    if (story.media_type === 'video') {
      await base44.asServiceRole.entities.ExperienceStory.update(story_id, {
        moderation_status: 'approved',
      });
      return Response.json({ removed: false, moderation_status: 'approved', note: 'video skipped' });
    }

    // Call LLM vision to check for inappropriate content only
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a content moderation AI. Analyze this image and determine ONLY if it contains:
- Explicit nudity or pornographic content
- Graphic violence or gore
- Child sexual abuse material (CSAM)
- Extreme hate symbols or incitement to violence

Return JSON with:
{
  "is_inappropriate": boolean,
  "reason": "brief reason if inappropriate, otherwise null"
}

DO NOT reject images for:
- Normal party/nightlife/social scenes
- People drinking alcohol or dancing
- Slightly suggestive but non-explicit content
- Normal everyday photos

Only flag genuinely harmful content.`,
      file_urls: [image_url],
      response_json_schema: {
        type: 'object',
        properties: {
          is_inappropriate: { type: 'boolean' },
          reason: { type: 'string' }
        }
      }
    });

    if (result.is_inappropriate) {
      // Notify the user
      const userId = story.user_id;
      if (userId) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          type: 'story_reaction',
          title: '⚠️ Story removed',
          message: 'Teu story foi removido por conteúdo impróprio. Em breve vamos aplicar da melhor forma como pode ser postado.',
          is_read: false,
        });
      }
      // Delete story
      await base44.asServiceRole.entities.ExperienceStory.delete(story_id);
      return Response.json({ removed: true, reason: result.reason });
    }

    // Approve story
    await base44.asServiceRole.entities.ExperienceStory.update(story_id, {
      moderation_status: 'approved',
    });

    return Response.json({ removed: false, moderation_status: 'approved' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
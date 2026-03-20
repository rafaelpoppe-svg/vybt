import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { story_id, image_url } = await req.json();

    if (!story_id || !image_url) {
      return Response.json({ error: 'Missing story_id or image_url' }, { status: 400 });
    }

    // Call LLM to check for inappropriate content only
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a content moderation AI. Analyze this image and determine ONLY if it contains:
- Explicit nudity or pornographic content
- Graphic violence or gore
- Child sexual abuse material
- Extreme hate symbols or content

Return JSON with:
{
  "is_inappropriate": boolean,
  "reason": "brief reason if inappropriate, otherwise null"
}

DO NOT reject images for:
- Normal party/nightlife/social scenes
- Alcohol or dancing
- Suggestive but not explicit content
- Normal everyday photos

Be strict only about genuinely harmful content.`,
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
      // Delete the story immediately
      const stories = await base44.asServiceRole.entities.ExperienceStory.filter({ id: story_id });
      if (stories[0]) {
        // Notify user via notification
        await base44.asServiceRole.entities.Notification.create({
          user_id: stories[0].user_id,
          type: 'story_reaction',
          title: '⚠️ Story removed',
          message: 'Your story was removed due to inappropriate content. Please review our community guidelines.',
          is_read: false,
        });
        // Delete story
        await base44.asServiceRole.entities.ExperienceStory.delete(story_id);
      }
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
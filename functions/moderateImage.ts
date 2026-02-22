import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_url, context } = await req.json();

    if (!image_url) {
      return Response.json({ error: 'No image URL provided' }, { status: 400 });
    }

    // context: 'profile_photo' or 'story'
    const isStory = context === 'story';

    const profilePrompt = `You are a content moderation AI for a nightlife and party social app called Vybt.

Analyze this image and respond with a JSON object with these fields:
- "approved": boolean (true if image is acceptable, false if it should be rejected)
- "reason": string (brief reason if rejected, empty string if approved)

REJECT the image if it contains:
- Nudity, pornographic or sexually explicit content
- Graphic violence, gore, or disturbing imagery
- Drawings, cartoons, anime, memes, illustrations, or AI-generated art
- Screenshots of other apps, text-only images, or logos
- Animals only (no humans visible)
- Offensive, hateful, or inappropriate symbols/gestures
- The person is clearly not a real human face (e.g. mannequin, statue)

APPROVE the image if it shows:
- A real person's face or body in a normal, clothed appearance
- A group of real people in a social setting
- A selfie or portrait of a real human

Be strict. If unsure, reject.`;

    const storyPrompt = `You are a content moderation AI for a nightlife and party social app called Vybt. Users post experience stories from parties, nightclubs, bars, and social events.

Analyze this image and respond with a JSON object with these fields:
- "approved": boolean (true if image is acceptable, false if it should be rejected)
- "reason": string (brief reason if rejected, empty string if approved)

REJECT the image if it contains:
- Nudity, pornographic or sexually explicit content
- Graphic violence, gore, or disturbing imagery
- Drawings, cartoons, anime, memes, or illustrated content
- Screenshots of apps, chats, or text-only images
- Offensive, hateful, or inappropriate symbols/gestures
- Random objects with no connection to a social/party event
- Content that is clearly not from a real social event or nightlife setting

APPROVE the image if it shows:
- People at a party, nightclub, bar, festival, or social event
- Drinks, music equipment, dance floors, crowds in a party environment
- Outdoor events, celebrations, or group social gatherings
- A genuine moment or atmosphere from a social/nightlife event

Be strict but fair. The content must clearly relate to a real social/nightlife experience.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: isStory ? storyPrompt : profilePrompt,
      file_urls: [image_url],
      response_json_schema: {
        type: 'object',
        properties: {
          approved: { type: 'boolean' },
          reason: { type: 'string' }
        }
      }
    });

    return Response.json({
      approved: result.approved === true,
      reason: result.reason || ''
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { caption, context } = payload;

    if (!caption || typeof caption !== 'string') {
      return Response.json({ error: 'Invalid caption' }, { status: 400 });
    }

    // Call LLM for caption analysis and suggestions
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a social media expert helping users improve their story captions for a party/nightlife social network.

Analyze this caption and provide feedback:

Caption: "${caption}"
Context: ${context || 'General story'}

Provide a JSON response with:
1. tone_appropriate (boolean): Is the tone suitable for the community?
2. tone_feedback (string): Brief feedback on tone (1-2 sentences)
3. content_quality (string): Assessment of clarity and engagement (1-2 sentences)
4. engagement_tips (string): One concrete tip to increase engagement
5. suggested_caption (string): An improved version if tone/quality issues detected, otherwise return the original caption

Keep suggestions concise, authentic, and in the same language as the original.`,
      response_json_schema: {
        type: 'object',
        properties: {
          tone_appropriate: { type: 'boolean' },
          tone_feedback: { type: 'string' },
          content_quality: { type: 'string' },
          engagement_tips: { type: 'string' },
          suggested_caption: { type: 'string' }
        },
        required: ['tone_appropriate', 'tone_feedback', 'content_quality', 'engagement_tips', 'suggested_caption']
      }
    });

    return Response.json(result);
  } catch (error) {
    console.error('Review caption error:', error);
    return Response.json({ 
      error: error.message || 'Failed to review caption',
      // Fallback response if AI fails
      tone_appropriate: true,
      tone_feedback: 'Could not analyze tone',
      content_quality: 'Analysis unavailable',
      engagement_tips: 'Consider adding emojis for more engagement',
      suggested_caption: null
    }, { status: 500 });
  }
});
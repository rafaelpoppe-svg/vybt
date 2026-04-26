import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user profile
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (!profiles.length) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profiles[0];

    // Set VybtPlus for 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await base44.entities.UserProfile.update(profile.id, {
      vybt_plus: true,
      vybt_plus_expires_at: expiresAt.toISOString(),
    });

    return Response.json({ success: true, expires_at: expiresAt.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
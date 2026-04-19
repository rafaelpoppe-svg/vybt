import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, type, message, title, plan_id, related_user_id } = await req.json();

    if (!user_id || !type || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check user notification preferences before creating
    let allowed = true;
    try {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id });
      const profile = profiles[0];
      if (profile?.notification_prefs) {
        const typeToPrefsKey = {
          new_group_message: 'group_message_push',
          new_direct_message: 'group_message_push',
          new_group_member: 'group_message_push',
          voting_started: 'voting_push',
          plan_happening_now: 'plan_update_push',
          plan_successful: 'voting_push',
          plan_unsuccessful: 'voting_push',
          plan_renewed: 'plan_update_push',
          new_story_in_plan: 'friend_story_push',
          friend_posted_story: 'friend_story_push',
          friend_request: 'friend_request_push',
          friend_created_plan: 'new_plan_push',
          plan_recommendation: 'new_plan_push',
          plan_time_changed: 'plan_update_push',
          plan_location_changed: 'plan_update_push',
          plan_highlighted: 'plan_update_push',
          story_highlighted: 'friend_story_push',
          story_reaction: 'friend_story_push',
        };
        const prefKey = typeToPrefsKey[type];
        if (prefKey && profile.notification_prefs[prefKey] === false) {
          allowed = false;
        }
      }
    } catch (_) {}

    if (!allowed) {
      return Response.json({ skipped: true });
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id,
      type,
      title: title || null,
      message,
      plan_id: plan_id || null,
      related_user_id: related_user_id || null,
      is_read: false,
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
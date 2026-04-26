import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await req.json();

    // Prices in cents
    const prices = {
      highlight_plan: 299,    // €2.99 one-time
      highlight_story: 159,   // €1.59 one-time
      vybt_plus_monthly: 499, // €4.99/month
    };

    const amount = prices[type];
    if (!amount) {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      metadata: {
        user_id: user.id,
        user_email: user.email,
        type,
      },
    });

    // For VybtPlus: after payment confirmation (handled by webhook or onSuccess),
    // the frontend will call activateVybtPlus function to update the profile.
    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
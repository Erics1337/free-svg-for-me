import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-04-22.dahlia',
});

// Create a Supabase client with the service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Credit package configurations
const CREDIT_PACKAGES: Record<string, { credits: number; price: number }> = {
  starter: { credits: 20, price: 400 }, // $4.00 in cents
  pro: { credits: 100, price: 1500 },   // $15.00 in cents
  power: { credits: 500, price: 6000 }, // $60.00 in cents
};

export async function POST(req: Request) {
  try {
    const { packageId } = await req.json();

    // Validate package
    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      );
    }

    // Get the current user from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Invalid authorization format' }, { status: 401 });
    }
    const token = authHeader.slice('Bearer '.length);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Generate a stable purchase ID upfront so it can be embedded in Stripe metadata
    const { data: purchase, error: purchaseError } = await supabase
      .from('credit_purchases')
      .insert({
        user_id: user.id,
        stripe_session_id: 'pending',
        credits_amount: pkg.credits,
        amount_paid_cents: pkg.price,
        status: 'pending',
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase record:', purchaseError);
      return NextResponse.json(
        { error: 'Failed to create purchase record' },
        { status: 500 }
      );
    }

    // Create Stripe checkout session — if this fails, delete the orphaned purchase row
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${pkg.credits} Credits - ${packageId.charAt(0).toUpperCase() + packageId.slice(1)} Package`,
                description: `Credit package for SVG Generator - ${pkg.credits} generations`,
              },
              unit_amount: pkg.price,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?payment=cancelled`,
        metadata: {
          purchase_id: purchase.id,
          user_id: user.id,
          credits: pkg.credits.toString(),
        },
        client_reference_id: purchase.id,
      });
    } catch (stripeError: any) {
      // Clean up the pending record so it doesn't remain as an orphan
      await supabase.from('credit_purchases').delete().eq('id', purchase.id);
      console.error('Stripe session creation failed:', stripeError);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    // Update the purchase record with the real Stripe session ID
    const { error: updateError } = await supabase
      .from('credit_purchases')
      .update({ stripe_session_id: session.id })
      .eq('id', purchase.id);

    if (updateError) {
      console.error('Failed to update purchase record with session ID:', updateError);
      return NextResponse.json(
        { error: 'Failed to finalise purchase record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during checkout' },
      { status: 500 }
    );
  }
}

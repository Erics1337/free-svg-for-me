import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the raw body
    const body = await req.text();

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get metadata
        const purchaseId = session.metadata?.purchase_id;
        const userId = session.metadata?.user_id;
        const credits = parseInt(session.metadata?.credits || '0', 10);

        if (!purchaseId || !userId || !credits) {
          console.error('Missing metadata in checkout session:', session.metadata);
          return new Response(
            JSON.stringify({ error: 'Missing metadata' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get the purchase record
        const { data: purchase, error: purchaseError } = await supabase
          .from('credit_purchases')
          .select('*')
          .eq('id', purchaseId)
          .single();

        if (purchaseError || !purchase) {
          console.error('Purchase record not found:', purchaseError);
          return new Response(
            JSON.stringify({ error: 'Purchase record not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if already processed
        if (purchase.status === 'completed') {
          console.log('Purchase already processed:', purchaseId);
          return new Response(
            JSON.stringify({ received: true, alreadyProcessed: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify metadata userId matches the stored purchase owner
        if (purchase.user_id !== userId) {
          console.error('User ID mismatch on purchase:', purchaseId, 'expected:', purchase.user_id);
          return new Response(
            JSON.stringify({ error: 'User ID mismatch' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Call the add_credits_after_purchase function
        const { data: result, error: rpcError } = await supabase.rpc('add_credits_after_purchase', {
          p_user_id: userId,
          p_purchase_id: purchaseId,
          p_credits_amount: credits,
        });

        if (rpcError) {
          console.error('Error adding credits:', rpcError);
          // Update purchase status to failed
          const { error: failUpdateError } = await supabase
            .from('credit_purchases')
            .update({ 
              status: 'failed',
              completed_at: new Date().toISOString()
            })
            .eq('id', purchaseId);

          if (failUpdateError) {
            console.error('Failed to mark purchase as failed after RPC error:', purchaseId, failUpdateError);
          }

          return new Response(
            JSON.stringify({ error: 'Failed to add credits' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update purchase with Stripe payment intent ID (only when present)
        if (session.payment_intent) {
          const { error: piUpdateError } = await supabase
            .from('credit_purchases')
            .update({ stripe_payment_intent_id: session.payment_intent as string })
            .eq('id', purchaseId);

          if (piUpdateError) {
            console.error('Failed to update payment_intent on purchase:', purchaseId, piUpdateError);
          }
        }

        console.log('Credits added successfully for user:', userId, 'credits:', credits);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseId = session.metadata?.purchase_id;
        
        if (purchaseId) {
          const { error: expiredUpdateError } = await supabase
            .from('credit_purchases')
            .update({ status: 'failed' })
            .eq('id', purchaseId);

          if (expiredUpdateError) {
            console.error('Failed to mark purchase as failed:', purchaseId, expiredUpdateError);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Try to find the purchase by payment intent if available
        // Note: At this point, we may not have the purchase_id in metadata
        // The checkout.session.expired event handles the cleanup
        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

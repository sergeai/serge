import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@16.12.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Test endpoint for debugging
  if (req.method === 'GET') {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    return new Response(JSON.stringify({
      message: 'Edge Function is running',
      supabaseUrl: supabaseUrl ? 'configured' : 'missing',
      serviceRoleKey: serviceRoleKey ? 'configured' : 'missing',
      stripeKey: Deno.env.get('STRIPE_SECRET_KEY') ? 'configured' : 'missing',
      webhookSecret: Deno.env.get('STRIPE_WEBHOOK_SECRET') ? 'configured' : 'missing'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Service Role Key exists:', !!serviceRoleKey)
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration')
      return new Response('Database configuration missing', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

    // Get the signature from headers
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('Missing stripe-signature header')
      return new Response('Missing signature', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Get the raw body
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET')
      return new Response('Webhook secret not configured', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // Verify the webhook signature (async version for Edge Functions)
    let event: Stripe.Event
    try {
      console.log('Attempting webhook signature verification...')
      console.log('Body length:', body.length)
      console.log('Signature present:', !!signature)
      console.log('Webhook secret present:', !!webhookSecret)
      
      // Use the async version which is required for Edge Functions
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      console.log('Webhook signature verification successful')
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      const error = err as Error
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      return new Response(`Invalid signature: ${error.message}`, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    console.log('Processing webhook event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, supabaseClient)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription, supabaseClient)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription, supabaseClient)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabaseClient)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice, supabaseClient)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, supabaseClient)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Handle successful checkout session
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabaseClient: any
) {
  console.log('Processing checkout.session.completed:', session.id)
  console.log('Session metadata:', session.metadata)
  console.log('Session customer:', session.customer)
  console.log('Session subscription:', session.subscription)

  const { userId, planType } = session.metadata || {}
  
  if (!userId || !planType) {
    console.error('Missing metadata in checkout session. Expected userId and planType, got:', session.metadata)
    return
  }

  try {
    // First, check if user exists
    const { data: userCheck, error: userCheckError } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userCheckError || !userCheck) {
      console.error('User not found:', userId, userCheckError)
      return
    }

    console.log('Found user:', userCheck.email)

    // Create or update subscription record
    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan_type: planType,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Inserting subscription data:', subscriptionData)

    // First try to update existing subscription
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single()

    let subscriptionResult
    let subscriptionError

    if (existingSubscription) {
      // Update existing subscription
      console.log('Updating existing subscription for user:', userId)
      const { data, error } = await supabaseClient
        .from('subscriptions')
        .update(subscriptionData)
        .eq('user_id', userId)
        .select()
      
      subscriptionResult = data
      subscriptionError = error
    } else {
      // Insert new subscription
      console.log('Creating new subscription for user:', userId)
      const { data, error } = await supabaseClient
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
      
      subscriptionResult = data
      subscriptionError = error
    }

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError)
      return
    }

    console.log('Subscription operation result:', subscriptionResult)

    // Update user profile with new subscription tier and allocate credits
    const auditLimits = {
      free: 10,
      basic: 50,
      enterprise: 999999 // Unlimited (using large number)
    }

    const creditsForPlan = auditLimits[planType as keyof typeof auditLimits] || 10

    const profileData = {
      subscription_tier: planType,
      audits_used_this_month: 0, // Reset usage
      audit_credits: creditsForPlan, // Set total credits for the plan
      monthly_reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log(`Allocating ${creditsForPlan} credits for ${planType} plan`)

    console.log('Updating profile with:', profileData)

    const { data: profileResult, error: profileError } = await supabaseClient
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return
    }

    console.log('Profile update result:', profileResult)
    console.log(`Successfully activated ${planType} subscription for user ${userId}`)

  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error)
    console.error('Error stack:', error.stack)
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabaseClient: any
) {
  console.log('Processing customer.subscription.created:', subscription.id)

  const customerId = subscription.customer as string
  
  // Find user by customer ID
  const { data: existingSubscription } = await supabaseClient
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (existingSubscription) {
    const { error } = await supabaseClient
      .from('subscriptions')
      .update({
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('Error updating subscription on creation:', error)
    }
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabaseClient: any
) {
  console.log('Processing customer.subscription.updated:', subscription.id)

  const { error } = await supabaseClient
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  } else {
    console.log(`Updated subscription ${subscription.id} status to ${subscription.status}`)
  }
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabaseClient: any
) {
  console.log('Processing customer.subscription.deleted:', subscription.id)

  // Update subscription status to canceled
  const { error: subscriptionError } = await supabaseClient
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (subscriptionError) {
    console.error('Error canceling subscription:', subscriptionError)
    return
  }

  // Downgrade user to free tier
  const { data: subscription_data } = await supabaseClient
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (subscription_data?.user_id) {
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_tier: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription_data.user_id)

    if (profileError) {
      console.error('Error downgrading user to free tier:', profileError)
    } else {
      console.log(`Downgraded user ${subscription_data.user_id} to free tier`)
    }
  }
}

// Handle successful payment
async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabaseClient: any
) {
  console.log('Processing invoice.payment_succeeded:', invoice.id)

  if (invoice.subscription) {
    // Update subscription status to active if it was past_due
    const { error } = await supabaseClient
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription)
      .eq('status', 'past_due')

    if (error) {
      console.error('Error reactivating subscription after payment:', error)
    } else {
      console.log(`Reactivated subscription ${invoice.subscription} after successful payment`)
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabaseClient: any
) {
  console.log('Processing invoice.payment_failed:', invoice.id)

  if (invoice.subscription) {
    // Update subscription status to past_due
    const { error } = await supabaseClient
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription)

    if (error) {
      console.error('Error marking subscription as past_due:', error)
    } else {
      console.log(`Marked subscription ${invoice.subscription} as past_due due to failed payment`)
    }
  }
}

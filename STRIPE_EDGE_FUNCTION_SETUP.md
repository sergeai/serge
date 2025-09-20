# Stripe Edge Function Setup Guide

This guide explains how to deploy and configure the Supabase Edge Function for handling Stripe webhook events and activating subscriptions.

## 🚀 Quick Setup

### 1. Install Supabase CLI

```bash
# Install via npm
npm install -g supabase

# Or via chocolatey (Windows)
choco install supabase

# Or download from: https://supabase.com/docs/guides/cli/getting-started
```

### 2. Deploy the Edge Function

Run the deployment script:

```powershell
.\deploy-edge-function.ps1
```

Or deploy manually:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Set environment variables
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
supabase secrets set SUPABASE_URL=https://your-project.supabase.co

# Deploy the function
supabase functions deploy activate-subscription
```

### 3. Configure Stripe Webhook

#### Option A: Direct Edge Function (Recommended)
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/activate-subscription`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

#### Option B: Via Your App (Current Setup)
Keep your current webhook: `https://your-domain.com/api/stripe/webhook`
The API route will forward requests to the Edge Function.

## 🔧 What the Edge Function Does

### Handles Stripe Events:

1. **`checkout.session.completed`**
   - Creates/updates subscription record
   - Updates user profile with new subscription tier
   - Resets monthly audit count

2. **`customer.subscription.updated`**
   - Updates subscription status and billing periods
   - Handles plan changes and renewals

3. **`customer.subscription.deleted`**
   - Marks subscription as canceled
   - Downgrades user to free tier

4. **`invoice.payment_succeeded`**
   - Reactivates past_due subscriptions
   - Ensures continuous service

5. **`invoice.payment_failed`**
   - Marks subscription as past_due
   - Triggers dunning management

### Database Updates:

- **`subscriptions` table**: Stripe subscription data
- **`profiles` table**: User subscription tier and audit limits

## 🧪 Testing

### Test the Edge Function:

```bash
# Monitor function logs
supabase functions logs activate-subscription --follow

# Test with curl
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/activate-subscription \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Test Stripe Integration:

1. Use Stripe's test mode
2. Create a test subscription
3. Check the function logs for processing
4. Verify database updates in Supabase

## 🔍 Monitoring

### View Function Logs:
```bash
supabase functions logs activate-subscription
```

### Common Issues:

1. **Missing Environment Variables**
   ```bash
   supabase secrets list
   supabase secrets set VARIABLE_NAME=value
   ```

2. **Webhook Signature Verification Failed**
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook endpoint URL is exact

3. **Database Permission Errors**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` has proper permissions
   - Check RLS policies allow service role access

## 📊 Environment Variables

Required in Supabase Edge Function:

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_... or sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (whsec_...) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for database access |

## 🔄 Deployment Updates

To update the Edge Function:

```bash
# Make changes to supabase/functions/activate-subscription/index.ts
# Then redeploy
supabase functions deploy activate-subscription
```

## 🚨 Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update webhook endpoint to production URL
- [ ] Test with real payments (small amounts)
- [ ] Monitor function logs for errors
- [ ] Set up alerts for failed webhook processing
- [ ] Verify database backups are enabled

## 📞 Support

If you encounter issues:

1. Check function logs: `supabase functions logs activate-subscription`
2. Verify environment variables: `supabase secrets list`
3. Test webhook signature verification
4. Check Supabase dashboard for function status

The Edge Function provides robust, serverless webhook processing that automatically scales and handles Stripe subscription lifecycle events reliably.

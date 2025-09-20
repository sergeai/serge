// Test script to debug webhook and database operations
// Run with: node test-webhook.js

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Testing Supabase connection...')
console.log('Supabase URL:', supabaseUrl)
console.log('Service Role Key exists:', !!serviceRoleKey)

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase configuration in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testDatabaseOperations() {
  try {
    console.log('\n1. Testing profiles table access...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, subscription_tier')
      .limit(5)

    if (profilesError) {
      console.error('Profiles error:', profilesError)
    } else {
      console.log('Profiles found:', profiles?.length || 0)
      if (profiles && profiles.length > 0) {
        console.log('Sample profile:', profiles[0])
      }
    }

    console.log('\n2. Testing subscriptions table access...')
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5)

    if (subscriptionsError) {
      console.error('Subscriptions error:', subscriptionsError)
    } else {
      console.log('Subscriptions found:', subscriptions?.length || 0)
    }

    console.log('\n3. Testing subscription creation...')
    // Create a test subscription (replace with actual user ID)
    const testUserId = profiles && profiles.length > 0 ? profiles[0].id : null
    
    if (testUserId) {
      const testSubscriptionData = {
        user_id: testUserId,
        stripe_customer_id: 'cus_test_123',
        stripe_subscription_id: 'sub_test_123',
        plan_type: 'basic',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Test subscription data:', testSubscriptionData)

      const { data: subscriptionResult, error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert(testSubscriptionData, {
          onConflict: 'user_id'
        })
        .select()

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError)
      } else {
        console.log('Subscription created successfully:', subscriptionResult)
      }

      console.log('\n4. Testing profile update...')
      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'basic',
          audits_used_this_month: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', testUserId)
        .select()

      if (profileError) {
        console.error('Profile update error:', profileError)
      } else {
        console.log('Profile updated successfully:', profileResult)
      }

      // Clean up test data
      console.log('\n5. Cleaning up test data...')
      await supabase
        .from('subscriptions')
        .delete()
        .eq('stripe_customer_id', 'cus_test_123')

      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          audits_used_this_month: 0
        })
        .eq('id', testUserId)

      console.log('Test data cleaned up')
    } else {
      console.log('No users found to test with')
    }

  } catch (error) {
    console.error('Test error:', error)
  }
}

// Run the test
testDatabaseOperations()
  .then(() => {
    console.log('\nDatabase test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })

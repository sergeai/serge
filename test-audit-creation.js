// Test script to debug audit creation
// Run with: node test-audit-creation.js

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Testing audit creation...')
console.log('Supabase URL:', supabaseUrl)
console.log('Service Role Key exists:', !!serviceRoleKey)

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase configuration in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testAuditCreation() {
  try {
    console.log('\n1. Testing profiles table access...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, subscription_tier, audits_used_this_month, audit_credits')
      .limit(1)

    if (profilesError) {
      console.error('Profiles error:', profilesError)
      return
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found. Creating a test user first.')
      return
    }

    const testUser = profiles[0]
    console.log('Using test user:', testUser.email)

    console.log('\n2. Testing audits table structure...')
    const { data: auditStructure, error: structureError } = await supabase
      .from('audits')
      .select('*')
      .limit(1)

    if (structureError) {
      console.error('Audits table structure error:', structureError)
      return
    }

    console.log('Audits table accessible')

    console.log('\n3. Testing audit creation...')
    const testAuditData = {
      user_id: testUser.id,
      business_email: 'test@example.com',
      domain: 'example.com',
      analysis_types: ['website_analysis', 'social_media'],
      status: 'processing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Inserting audit data:', testAuditData)

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert(testAuditData)
      .select()
      .single()

    if (auditError) {
      console.error('Audit creation error:', auditError)
      return
    }

    if (!audit) {
      console.error('No audit data returned after insert')
      return
    }

    console.log('✅ Audit created successfully!')
    console.log('Audit ID:', audit.id)
    console.log('Audit data:', audit)

    console.log('\n4. Testing audit update...')
    const testResults = {
      overallScore: 75,
      summary: 'Test audit results',
      parameters: {},
      actionPlan: ['Test action'],
      opportunities: ['Test opportunity'],
      risks: ['Test risk'],
      competitiveAdvantage: ['Test advantage'],
      implementationRoadmap: []
    }

    const { data: updatedAudit, error: updateError } = await supabase
      .from('audits')
      .update({
        status: 'completed',
        results: testResults,
        overall_score: testResults.overallScore,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', audit.id)
      .select()

    if (updateError) {
      console.error('Audit update error:', updateError)
      return
    }

    console.log('✅ Audit updated successfully!')
    console.log('Updated audit:', updatedAudit)

    console.log('\n5. Testing credit deduction...')
    const newCreditsUsed = (testUser.audits_used_this_month || 0) + 1

    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        audits_used_this_month: newCreditsUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', testUser.id)
      .select()

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError)
      return
    }

    console.log('✅ Credits deducted successfully!')
    console.log('Updated profile:', updatedProfile)

    // Clean up test data
    console.log('\n6. Cleaning up test data...')
    await supabase
      .from('audits')
      .delete()
      .eq('id', audit.id)

    await supabase
      .from('profiles')
      .update({
        audits_used_this_month: testUser.audits_used_this_month || 0
      })
      .eq('id', testUser.id)

    console.log('✅ Test data cleaned up')

  } catch (error) {
    console.error('Test error:', error)
  }
}

// Run the test
testAuditCreation()
  .then(() => {
    console.log('\n🎉 Audit creation test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })

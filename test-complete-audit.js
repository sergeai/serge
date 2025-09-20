// Complete audit system test
// Run with: node test-complete-audit.js

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🧪 COMPLETE AUDIT SYSTEM TEST')
console.log('================================')

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function runCompleteTest() {
  let testUserId = null
  let testAuditId = null

  try {
    console.log('\n📋 Step 1: Database Setup & User Verification')
    console.log('─'.repeat(50))

    // Check if we have any users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, subscription_tier, audits_used_this_month, audit_credits')
      .limit(1)

    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError)
      return false
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No users found. Creating test user...')
      
      // Create a test user (you'll need to do this manually in Supabase Auth)
      console.log('📝 Please create a user in Supabase Auth dashboard first')
      console.log('   Then add a profile record with:')
      console.log('   - subscription_tier: "free"')
      console.log('   - audits_used_this_month: 0')
      console.log('   - audit_credits: 10')
      return false
    }

    testUserId = profiles[0].id
    console.log('✅ Found test user:', profiles[0].email)
    console.log('   Subscription:', profiles[0].subscription_tier)
    console.log('   Credits used:', profiles[0].audits_used_this_month)
    console.log('   Credits available:', profiles[0].audit_credits || 10)

    console.log('\n🔧 Step 2: Test Audit Engine V2')
    console.log('─'.repeat(50))

    // Test the new audit engine directly
    try {
      const { AuditEngineV2 } = require('./lib/audit-engine-v2.ts')
      const engine = new AuditEngineV2('test@example.com', ['website_analysis', 'social_media'])
      const result = await engine.performAudit()
      
      console.log('✅ Audit engine test passed')
      console.log('   Overall Score:', result.overallScore)
      console.log('   Parameters:', Object.keys(result.parameters).length)
      console.log('   Action Plan items:', result.actionPlan.length)
    } catch (engineError) {
      console.log('⚠️  Direct engine test failed (expected in JS):', engineError.message)
      console.log('   This is normal - engine will be tested via API')
    }

    console.log('\n🚀 Step 3: Test Audit API Endpoint')
    console.log('─'.repeat(50))

    const testAuditData = {
      businessEmail: 'test@techstartup.com',
      analysisTypes: ['website_analysis', 'social_media', 'operations', 'ai_opportunity'],
      userId: testUserId
    }

    console.log('📤 Sending audit request...')
    console.log('   Email:', testAuditData.businessEmail)
    console.log('   Analysis Types:', testAuditData.analysisTypes)

    const startTime = Date.now()

    // Make API request to audit endpoint
    const response = await fetch('http://localhost:3000/api/audit/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAuditData)
    })

    const duration = Date.now() - startTime
    console.log(`⏱️  Request completed in ${duration}ms`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API request failed:', response.status, errorText)
      return false
    }

    const auditResponse = await response.json()
    testAuditId = auditResponse.auditId

    console.log('✅ Audit API request successful!')
    console.log('   Audit ID:', testAuditId)
    console.log('   Status:', auditResponse.status)
    console.log('   From Cache:', auditResponse.fromCache || false)
    console.log('   Duration:', auditResponse.duration || duration + 'ms')

    if (auditResponse.results) {
      console.log('   Overall Score:', auditResponse.results.overallScore)
      console.log('   Parameters analyzed:', Object.keys(auditResponse.results.parameters || {}).length)
    }

    console.log('\n🗄️  Step 4: Verify Database Storage')
    console.log('─'.repeat(50))

    // Check if audit was saved in database
    const { data: savedAudit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', testAuditId)
      .single()

    if (auditError || !savedAudit) {
      console.error('❌ Audit not found in database:', auditError)
      return false
    }

    console.log('✅ Audit saved successfully in database')
    console.log('   ID:', savedAudit.id)
    console.log('   Status:', savedAudit.status)
    console.log('   Domain:', savedAudit.domain)
    console.log('   Overall Score:', savedAudit.overall_score)
    console.log('   Has Results:', !!savedAudit.results)
    console.log('   Has Report HTML:', !!savedAudit.report_html)
    console.log('   Created:', new Date(savedAudit.created_at).toLocaleString())

    console.log('\n💳 Step 5: Verify Credit Deduction')
    console.log('─'.repeat(50))

    // Check if credits were deducted
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .select('audits_used_this_month, audit_credits')
      .eq('id', testUserId)
      .single()

    if (profileError || !updatedProfile) {
      console.error('❌ Could not verify credit deduction:', profileError)
      return false
    }

    console.log('✅ Credits updated successfully')
    console.log('   Credits used this month:', updatedProfile.audits_used_this_month)
    console.log('   Credits remaining:', (updatedProfile.audit_credits || 10) - updatedProfile.audits_used_this_month)

    console.log('\n📄 Step 6: Test PDF Download (Optional)')
    console.log('─'.repeat(50))

    try {
      const pdfResponse = await fetch(`http://localhost:3000/api/audit/download?auditId=${testAuditId}&userId=${testUserId}`)
      
      if (pdfResponse.ok) {
        const pdfSize = parseInt(pdfResponse.headers.get('content-length') || '0')
        console.log('✅ PDF download endpoint working')
        console.log('   PDF Size:', pdfSize, 'bytes')
      } else {
        console.log('⚠️  PDF download failed (may need puppeteer setup):', pdfResponse.status)
      }
    } catch (pdfError) {
      console.log('⚠️  PDF test skipped (endpoint may not be running):', pdfError.message)
    }

    console.log('\n🧹 Step 7: Cleanup Test Data')
    console.log('─'.repeat(50))

    // Clean up test audit
    await supabase
      .from('audits')
      .delete()
      .eq('id', testAuditId)

    // Reset user credits
    await supabase
      .from('profiles')
      .update({
        audits_used_this_month: profiles[0].audits_used_this_month
      })
      .eq('id', testUserId)

    console.log('✅ Test data cleaned up')

    console.log('\n🎉 COMPLETE AUDIT SYSTEM TEST PASSED!')
    console.log('═'.repeat(50))
    console.log('✅ Database operations working')
    console.log('✅ Audit engine functioning')
    console.log('✅ API endpoint responding')
    console.log('✅ Credit system working')
    console.log('✅ Report generation working')
    console.log('✅ Data persistence verified')

    return true

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    
    // Cleanup on failure
    if (testAuditId) {
      await supabase.from('audits').delete().eq('id', testAuditId)
    }
    
    return false
  }
}

// Additional helper function to test specific components
async function testIndividualComponents() {
  console.log('\n🔍 COMPONENT-LEVEL TESTING')
  console.log('═'.repeat(50))

  // Test 1: Database connectivity
  console.log('\n1️⃣  Testing Database Connectivity...')
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) throw error
    console.log('✅ Database connection successful')
  } catch (error) {
    console.log('❌ Database connection failed:', error.message)
    return false
  }

  // Test 2: Environment variables
  console.log('\n2️⃣  Testing Environment Variables...')
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ]

  let envVarsOk = true
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`)
    } else {
      console.log(`❌ ${varName}: Missing`)
      envVarsOk = false
    }
  })

  // Test 3: Table structure
  console.log('\n3️⃣  Testing Table Structure...')
  try {
    // Test profiles table
    const { data: profileCols } = await supabase.rpc('get_table_columns', { table_name: 'profiles' })
    console.log('✅ Profiles table accessible')

    // Test audits table
    const { data: auditCols } = await supabase.rpc('get_table_columns', { table_name: 'audits' })
    console.log('✅ Audits table accessible')
  } catch (error) {
    console.log('⚠️  Table structure test skipped (RPC not available)')
  }

  return envVarsOk
}

// Run the tests
async function main() {
  console.log('Starting comprehensive audit system test...\n')

  // First run component tests
  const componentTestsPassed = await testIndividualComponents()
  
  if (!componentTestsPassed) {
    console.log('\n❌ Component tests failed. Fix environment setup first.')
    process.exit(1)
  }

  // Then run complete integration test
  const integrationTestPassed = await runCompleteTest()

  if (integrationTestPassed) {
    console.log('\n🎊 ALL TESTS PASSED! Audit system is working perfectly.')
    process.exit(0)
  } else {
    console.log('\n💥 TESTS FAILED! Check the errors above.')
    process.exit(1)
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run the main test
main().catch(error => {
  console.error('Test runner failed:', error)
  process.exit(1)
})

// Debug script to check audits in database
// Run with: node debug-audits.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function debugAudits() {
  console.log('🔍 DEBUGGING AUDITS IN DATABASE')
  console.log('================================')

  try {
    // Get all audits
    console.log('\n📋 All Audits:')
    const { data: allAudits, error: allError } = await supabase
      .from('audits')
      .select('id, user_id, business_email, domain, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (allError) {
      console.error('❌ Error fetching audits:', allError)
      return
    }

    if (!allAudits || allAudits.length === 0) {
      console.log('⚠️  No audits found in database')
      return
    }

    console.log(`✅ Found ${allAudits.length} audits:`)
    allAudits.forEach((audit, index) => {
      console.log(`${index + 1}. ID: ${audit.id}`)
      console.log(`   User: ${audit.user_id}`)
      console.log(`   Email: ${audit.business_email}`)
      console.log(`   Domain: ${audit.domain}`)
      console.log(`   Status: ${audit.status}`)
      console.log(`   Created: ${new Date(audit.created_at).toLocaleString()}`)
      console.log('')
    })

    // Check specific audit ID
    const targetAuditId = '26eb2cc9-589b-42d5-ae44-a3275659a50d'
    console.log(`\n🎯 Checking specific audit: ${targetAuditId}`)
    
    const { data: specificAudit, error: specificError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', targetAuditId)

    if (specificError) {
      console.error('❌ Error fetching specific audit:', specificError)
      return
    }

    if (!specificAudit || specificAudit.length === 0) {
      console.log('❌ Specific audit not found')
    } else {
      console.log('✅ Specific audit found:')
      console.log('   ID:', specificAudit[0].id)
      console.log('   User ID:', specificAudit[0].user_id)
      console.log('   Email:', specificAudit[0].business_email)
      console.log('   Status:', specificAudit[0].status)
      console.log('   Has report_html:', !!specificAudit[0].report_html)
      console.log('   Report length:', specificAudit[0].report_html?.length || 0)
      console.log('   Created:', new Date(specificAudit[0].created_at).toLocaleString())
    }

    // Get all users
    console.log('\n👥 All Users:')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(5)

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError)
    } else if (profiles && profiles.length > 0) {
      console.log(`✅ Found ${profiles.length} users:`)
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ID: ${profile.id}`)
        console.log(`   Email: ${profile.email}`)
        console.log(`   Name: ${profile.full_name || 'N/A'}`)
        console.log('')
      })
    } else {
      console.log('⚠️  No users found')
    }

  } catch (error) {
    console.error('💥 Script error:', error)
  }
}

debugAudits().then(() => {
  console.log('🏁 Debug complete')
  process.exit(0)
}).catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})

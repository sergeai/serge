// Quick setup verification script
// Run with: node verify-setup.js

require('dotenv').config()

console.log('🔍 LEADAI - SETUP VERIFICATION')
console.log('=========================================')

let allGood = true

// Check environment variables
console.log('\n📋 Environment Variables:')
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY', 
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
]

requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    const maskedValue = varName.includes('SECRET') || varName.includes('KEY') 
      ? value.substring(0, 8) + '...' 
      : value
    console.log(`✅ ${varName}: ${maskedValue}`)
  } else {
    console.log(`❌ ${varName}: Missing`)
    allGood = false
  }
})

// Check OpenAI key format
if (process.env.OPENAI_API_KEY) {
  if (process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('✅ OpenAI API key format: Valid')
  } else {
    console.log('⚠️  OpenAI API key format: Invalid (should start with sk-)')
    allGood = false
  }
}

// Check Stripe keys format
if (process.env.STRIPE_SECRET_KEY) {
  if (process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.log('✅ Stripe secret key format: Valid')
  } else {
    console.log('⚠️  Stripe secret key format: Invalid (should start with sk_)')
  }
}

if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    console.log('✅ Stripe publishable key format: Valid')
  } else {
    console.log('⚠️  Stripe publishable key format: Invalid (should start with pk_)')
  }
}

// Check dependencies
console.log('\n📦 Dependencies:')
try {
  require('@supabase/supabase-js')
  console.log('✅ @supabase/supabase-js: Installed')
} catch {
  console.log('❌ @supabase/supabase-js: Missing')
  allGood = false
}

try {
  require('openai')
  console.log('✅ openai: Installed')
} catch {
  console.log('❌ openai: Missing')
  allGood = false
}

try {
  require('stripe')
  console.log('✅ stripe: Installed')
} catch {
  console.log('❌ stripe: Missing')
  allGood = false
}

try {
  require('puppeteer')
  console.log('✅ puppeteer: Installed')
} catch {
  console.log('⚠️  puppeteer: Missing (PDF generation will not work)')
}

// Check file structure
console.log('\n📁 File Structure:')
const fs = require('fs')
const path = require('path')

const requiredFiles = [
  'app/api/audit/run/route.ts',
  'lib/audit-engine-v2.ts',
  'lib/report-generator.ts',
  'database_setup.sql'
]

requiredFiles.forEach(filePath => {
  if (fs.existsSync(path.join(__dirname, filePath))) {
    console.log(`✅ ${filePath}: Exists`)
  } else {
    console.log(`❌ ${filePath}: Missing`)
    allGood = false
  }
})

// Summary
console.log('\n📊 Setup Summary:')
if (allGood) {
  console.log('🎉 Setup looks good! You can proceed with testing.')
  console.log('\nNext steps:')
  console.log('1. npm run dev (start development server)')
  console.log('2. npm run test:complete (run full audit test)')
} else {
  console.log('❌ Setup has issues. Please fix the problems above.')
  console.log('\nCommon fixes:')
  console.log('1. Copy .env.example to .env and fill in your keys')
  console.log('2. Run: npm install')
  console.log('3. Set up your Supabase database with database_setup.sql')
}

console.log('\n🔗 Useful commands:')
console.log('npm run dev          - Start development server')
console.log('npm run test:complete - Test complete audit system')
console.log('npm run test:audit   - Test basic audit creation')
console.log('node verify-setup.js - Run this verification again')

process.exit(allGood ? 0 : 1)

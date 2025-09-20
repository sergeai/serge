import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Audit configuration
const AUDIT_LIMITS = {
  free: 10,
  basic: 50,
  enterprise: 999999 // Unlimited
} as const

interface AuditRequest {
  businessEmail: string
  analysisTypes: string[]
  userId: string
}

interface UserProfile {
  id: string
  subscription_tier: 'free' | 'basic' | 'enterprise'
  audits_used_this_month: number
  audit_credits: number
}

interface AuditResult {
  overallScore: number
  parameters: Record<string, any>
  summary: string
  actionPlan: string[]
  opportunities: string[]
  risks: string[]
  competitiveAdvantage: string[]
  implementationRoadmap: Array<{
    phase: string
    duration: string
    actions: string[]
    expectedROI: string
  }>
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let auditId: string | null = null

  try {
    // 0. Validate environment variables
    const missingEnvVars = []
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingEnvVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnvVars.push('SUPABASE_SERVICE_ROLE_KEY')
    if (!process.env.OPENAI_API_KEY) missingEnvVars.push('OPENAI_API_KEY')
    
    if (missingEnvVars.length > 0) {
      console.error('[AUDIT] Missing environment variables:', missingEnvVars)
      return NextResponse.json(
        { error: `Missing required environment variables: ${missingEnvVars.join(', ')}` },
        { status: 500 }
      )
    }

    console.log('[AUDIT] Environment variables validated successfully')

    // 1. Parse and validate request
    const requestData = await parseAndValidateRequest(request)
    const { businessEmail, analysisTypes, userId } = requestData

    console.log(`[AUDIT] Starting audit for ${businessEmail} (User: ${userId})`)

    // 2. Verify user and check limits
    const user = await verifyUserAndLimits(userId)
    
    // 3. Extract domain and check for existing audits
    const domain = businessEmail.split('@')[1]
    const existingAudit = await checkExistingAudit(userId, domain)
    
    if (existingAudit) {
      console.log(`[AUDIT] Returning existing audit: ${existingAudit.id}`)
      return NextResponse.json({
        auditId: existingAudit.id,
        status: 'completed',
        results: existingAudit.results,
        fromCache: true
      })
    }

    // 4. Create new audit record
    const audit = await createAuditRecord({
      userId,
      businessEmail,
      domain,
      analysisTypes
    })
    auditId = audit.id

    console.log(`[AUDIT] Created audit record: ${auditId}`)

    // Ensure auditId is not null after creation
    if (!auditId) {
      throw new AuditError('Failed to create audit record')
    }

    // 5. Run audit analysis
    const auditResult = await runAuditAnalysis({
      domain,
      businessEmail,
      analysisTypes,
      auditId
    })

    // 6. Generate report
    const reportHtml = await generateAuditReport(auditResult, domain, businessEmail)

    // 7. Update audit with results
    await updateAuditWithResults(auditId, auditResult, reportHtml)

    // 8. Deduct credits
    await deductUserCredits(userId, user.audits_used_this_month)

    const duration = Date.now() - startTime
    console.log(`[AUDIT] Completed successfully in ${duration}ms`)

    return NextResponse.json({
      auditId,
      status: 'completed',
      results: auditResult,
      duration,
      fromCache: false
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[AUDIT] Failed after ${duration}ms:`, error)
    
    // Enhanced error logging for Vercel debugging
    console.error('[AUDIT] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: error?.constructor?.name || 'Unknown',
      auditId,
      environment: process.env.NODE_ENV,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSupabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    // Mark audit as failed if we created one
    if (auditId) {
      await markAuditAsFailed(auditId, error instanceof Error ? error.message : 'Unknown error')
    }

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (error instanceof LimitError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    // Return more detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        auditId,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}

// Custom error classes
class ValidationError extends Error {}
class AuthError extends Error {}
class LimitError extends Error {}
class AuditError extends Error {}

async function parseAndValidateRequest(request: NextRequest): Promise<AuditRequest> {
  let body
  try {
    body = await request.json()
  } catch {
    throw new ValidationError('Invalid JSON in request body')
  }

  const { businessEmail, analysisTypes, userId } = body

  if (!businessEmail || !analysisTypes || !userId) {
    throw new ValidationError('Missing required parameters: businessEmail, analysisTypes, userId')
  }

  if (!Array.isArray(analysisTypes) || analysisTypes.length === 0) {
    throw new ValidationError('analysisTypes must be a non-empty array')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(businessEmail)) {
    throw new ValidationError('Invalid email format')
  }

  return { businessEmail, analysisTypes, userId }
}

async function verifyUserAndLimits(userId: string): Promise<UserProfile> {
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, subscription_tier, audits_used_this_month, audit_credits')
    .eq('id', userId)
    .single()

  if (error || !user) {
    throw new AuthError('User not found or access denied')
  }

  // Check if user has enough credits
  if (user.audit_credits <= 0) {
    throw new LimitError('Insufficient audit credits. Please upgrade your plan or purchase more credits.')
  }

  const userLimit = AUDIT_LIMITS[user.subscription_tier as keyof typeof AUDIT_LIMITS] || AUDIT_LIMITS.free
  
  if (userLimit !== 999999 && user.audits_used_this_month >= userLimit) {
    throw new LimitError(`Audit limit reached for ${user.subscription_tier} plan (${userLimit} audits/month)`)
  }

  return user
}

async function checkExistingAudit(userId: string, domain: string) {
  const { data: existingAudit } = await supabase
    .from('audits')
    .select('id, status, results, created_at')
    .eq('domain', domain)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Return existing audit if completed within last 24 hours
  if (existingAudit) {
    const auditAge = Date.now() - new Date(existingAudit.created_at).getTime()
    const twentyFourHours = 24 * 60 * 60 * 1000
    
    if (auditAge < twentyFourHours) {
      return existingAudit
    }
  }

  return null
}

async function createAuditRecord(data: {
  userId: string
  businessEmail: string
  domain: string
  analysisTypes: string[]
}) {
  const auditData = {
    user_id: data.userId,
    business_email: data.businessEmail,
    domain: data.domain,
    analysis_types: data.analysisTypes,
    status: 'processing',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data: audit, error } = await supabase
    .from('audits')
    .insert(auditData)
    .select('id')
    .single()

  if (error || !audit) {
    console.error('[AUDIT] Database error creating audit:', error)
    throw new AuditError('Failed to create audit record')
  }

  return audit
}

async function runAuditAnalysis(params: {
  domain: string
  businessEmail: string
  analysisTypes: string[]
  auditId: string
}): Promise<AuditResult> {
  const { domain, businessEmail, analysisTypes } = params

  try {
    // Try AI-powered analysis first
    console.log(`[AUDIT] Attempting AI analysis for ${domain}`)
    
    const { runAIAuditAnalysis } = await import('@/lib/audit-engine-v2')
    const result = await runAIAuditAnalysis({
      domain,
      email: businessEmail,
      analysisTypes
    })
    
    console.log(`[AUDIT] AI analysis completed successfully`)
    return result

  } catch (analysisError) {
    console.error(`[AUDIT] Analysis completely failed:`, analysisError)
    throw new Error('Audit analysis failed: ' + (analysisError instanceof Error ? analysisError.message : 'Unknown error'))
  }
}

async function generateAuditReport(auditResult: AuditResult, domain: string, businessEmail: string): Promise<string> {
  try {
    const { generateDetailedAuditReport } = await import('@/lib/report-generator')
    return await generateDetailedAuditReport(auditResult)
  } catch (error) {
    console.warn('[AUDIT] Detailed report generation failed, using basic report:', error)
    
    // Fallback to basic HTML report
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Business Audit Report - ${domain}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: #667eea; color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .score { font-size: 3rem; font-weight: bold; margin: 20px 0; }
        .section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .item { background: white; padding: 10px; margin: 10px 0; border-left: 4px solid #667eea; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Business Audit Report</h1>
        <p>${businessEmail} | ${domain}</p>
        <div class="score">${auditResult.overallScore}/100</div>
    </div>
    
    <div class="section">
        <h2>Executive Summary</h2>
        <p>${auditResult.summary}</p>
    </div>
    
    <div class="section">
        <h2>Action Plan</h2>
        ${auditResult.actionPlan.map(action => `<div class="item">${action}</div>`).join('')}
    </div>
    
    <div class="section">
        <h2>Opportunities</h2>
        ${auditResult.opportunities.map(opp => `<div class="item">${opp}</div>`).join('')}
    </div>
    
    <div class="section">
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`
  }
}

async function updateAuditWithResults(auditId: string, auditResult: AuditResult, reportHtml: string) {
  const { error } = await supabase
    .from('audits')
    .update({
      status: 'completed',
      results: auditResult,
      report_html: reportHtml,
      overall_score: auditResult.overallScore,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', auditId)

  if (error) {
    console.error('[AUDIT] Failed to update audit results:', error)
    throw new AuditError('Failed to save audit results')
  }
}

async function deductUserCredits(userId: string, currentUsage: number) {
  // First get current audit_credits to deduct from
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('audit_credits')
    .eq('id', userId)
    .single()

  if (fetchError) {
    console.error('[AUDIT] Failed to fetch user credits:', fetchError)
    return
  }

  const currentCredits = profile?.audit_credits || 0
  const newCredits = Math.max(0, currentCredits - 1) // Ensure credits don't go below 0

  const { error } = await supabase
    .from('profiles')
    .update({
      audits_used_this_month: currentUsage + 1,
      audit_credits: newCredits,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('[AUDIT] Failed to update user credits:', error)
    // Don't throw error here - audit was successful, credit update is secondary
  } else {
    console.log(`[AUDIT] Credits updated: usage ${currentUsage + 1}, credits remaining: ${newCredits}`)
  }
}

async function markAuditAsFailed(auditId: string, errorMessage: string) {
  await supabase
    .from('audits')
    .update({
      status: 'failed',
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq('id', auditId)
}

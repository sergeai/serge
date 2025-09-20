import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { businessEmail, analysisTypes, userId } = await request.json()

    if (!businessEmail || !analysisTypes || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(businessEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check user's audit limits
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('subscription_tier, audits_used_this_month, audit_credits')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has enough credits
    if (user.audit_credits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient audit credits. Please upgrade your plan or purchase more credits.' },
        { status: 403 }
      )
    }

    // Check audit limits based on subscription tier
    const auditLimits = {
      free: 10,
      basic: 50,
      enterprise: -1 // Unlimited
    }

    const userLimit = auditLimits[user.subscription_tier as keyof typeof auditLimits] || 10
    
    if (userLimit !== -1 && user.audits_used_this_month >= userLimit) {
      return NextResponse.json(
        { error: 'Audit limit reached for your subscription tier' },
        { status: 403 }
      )
    }

    // Extract domain from email
    const domain = businessEmail.split('@')[1]

    // Create new audit record
    console.log('Creating basic audit record for:', { userId, businessEmail, domain, analysisTypes })
    
    const auditData = {
      user_id: userId,
      business_email: businessEmail,
      domain,
      analysis_types: analysisTypes,
      status: 'processing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert(auditData)
      .select()
      .single()

    if (auditError) {
      console.error('Audit creation error:', auditError)
      return NextResponse.json(
        { error: 'Failed to create audit record', details: auditError.message },
        { status: 500 }
      )
    }

    if (!audit) {
      console.error('No audit data returned after insert')
      return NextResponse.json(
        { error: 'No audit record created' },
        { status: 500 }
      )
    }

    console.log('Basic audit record created successfully:', audit.id)

    // Run basic analysis without AI
    try {
      console.log('Starting basic audit analysis...')
      
      // Import and use the basic audit engine
      const { AuditEngine } = await import('@/lib/audit-engine')
      const auditEngine = new AuditEngine(businessEmail, analysisTypes)
      const basicAudit = await auditEngine.performAudit()
      
      console.log('Basic analysis completed:', basicAudit.score)

      // Create simple HTML report
      const reportHtml = generateBasicReport(basicAudit, domain, businessEmail)

      // Update audit with results
      console.log('Updating audit with basic results for ID:', audit.id)
      
      const { data: updatedAudit, error: updateError } = await supabase
        .from('audits')
        .update({
          status: 'completed',
          results: basicAudit,
          report_html: reportHtml,
          overall_score: basicAudit.score,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', audit.id)
        .select()

      if (updateError) {
        console.error('Failed to update audit results:', updateError)
        throw new Error(`Audit update failed: ${updateError.message}`)
      }

      console.log('Basic audit updated successfully')

      // Deduct credits after successful report generation
      const newCreditsUsed = user.audits_used_this_month + 1
      const newCredits = Math.max(0, user.audit_credits - 1)

      await supabase
        .from('profiles')
        .update({
          audits_used_this_month: newCreditsUsed,
          audit_credits: newCredits,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      console.log(`Credits deducted. Used: ${newCreditsUsed}, credits remaining: ${newCredits}`)

      return NextResponse.json({
        auditId: audit.id,
        status: 'completed',
        results: basicAudit,
        message: 'Basic audit completed successfully'
      })

    } catch (analysisError) {
      console.error('Basic audit analysis failed:', analysisError)
      
      // Update audit status to failed
      await supabase
        .from('audits')
        .update({
          status: 'failed',
          error_message: 'Basic analysis failed'
        })
        .eq('id', audit.id)

      return NextResponse.json(
        { error: 'Basic audit analysis failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Basic audit API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateBasicReport(auditResult: any, domain: string, businessEmail: string): string {
  // Generate analysis sections
  const analysisHtml = auditResult.analysis 
    ? Object.keys(auditResult.analysis).map(key => {
        const section = auditResult.analysis[key]
        return `
            <h3>${key.replace('_', ' ').toUpperCase()}</h3>
            <p>Score: ${section.score || 0}/100</p>
            <p>Issues: ${section.issues?.join(', ') || 'None identified'}</p>
            <p>Opportunities: ${section.opportunities?.join(', ') || 'None identified'}</p>
        `
      }).join('')
    : '<p>Analysis data not available</p>'

  // Generate recommendations
  const recommendationsHtml = auditResult.recommendations?.length 
    ? auditResult.recommendations.map((rec: string) => `
        <div class="recommendation">${rec}</div>
      `).join('')
    : '<p>No specific recommendations available</p>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LeadAI Audit Report - ${domain}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: #667eea; color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .score { font-size: 3rem; font-weight: bold; margin: 20px 0; }
        .section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .recommendation { background: white; padding: 10px; margin: 10px 0; border-left: 4px solid #667eea; }
    </style>
</head>
<body>
    <div class="header">
        <h1>LeadAI Business Audit Report</h1>
        <p>Domain: ${domain}</p>
        <p>Email: ${businessEmail}</p>
    </div>
    
    <div class="section">
        <h2>Overall Score</h2>
        <div class="score">${auditResult.score || 0}/100</div>
    </div>
    
    <div class="section">
        <h2>Analysis Results</h2>
        ${analysisHtml}
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        ${recommendationsHtml}
    </div>
    
    <div class="section">
        <p><strong>Report generated on:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Generated by:</strong> LeadAI Platform</p>
    </div>
</body>
</html>`
}

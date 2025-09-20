import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuditEngine } from '@/lib/audit-engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json()

    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    // Get the audit details
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // Update status to processing
    const { error: updateError } = await supabase
      .from('audits')
      .update({ status: 'processing' })
      .eq('id', auditId)

    if (updateError) {
      console.error('Error updating audit status:', updateError)
      return NextResponse.json({ error: 'Failed to update audit status' }, { status: 500 })
    }

    try {
      // Initialize the audit engine
      const auditEngine = new AuditEngine(audit.business_email, audit.analysis_types)

      // Perform the actual audit
      const results = await auditEngine.performAudit()

      // Update the audit with results
      const { error: completionError } = await supabase
        .from('audits')
        .update({
          status: 'completed',
          ai_readiness_score: results.score,
          results: {
            score: results.score,
            analysis: results.analysis,
            recommendations: results.recommendations
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', auditId)

      if (completionError) {
        throw completionError
      }

      return NextResponse.json({ 
        success: true, 
        score: results.score,
        message: 'Audit completed successfully' 
      })

    } catch (analysisError) {
      console.error('Analysis error:', analysisError)
      
      // Update status to failed
      await supabase
        .from('audits')
        .update({ 
          status: 'failed',
          results: {
            error: 'Analysis failed',
            message: analysisError instanceof Error ? analysisError.message : 'Unknown error'
          }
        })
        .eq('id', auditId)

      return NextResponse.json({ 
        error: 'Audit analysis failed',
        details: analysisError instanceof Error ? analysisError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

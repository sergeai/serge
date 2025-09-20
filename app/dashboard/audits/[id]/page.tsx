'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeftIcon, DocumentArrowDownIcon, ShareIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'

interface Audit {
  id: string
  user_id: string
  business_email: string
  domain: string
  website_url?: string
  analysis_types: string[]
  status: string
  overall_score: number
  results: any
  report_html: string
  error_message?: string
  completed_at: string
  created_at: string
  updated_at: string
}

export default function AuditResultPage() {
  console.log('AuditResultPage component rendering...')
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [audit, setAudit] = useState<Audit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAudit() {
      if (!params.id || authLoading) return

      try {
        setLoading(true)
        setError('')
        console.log('Loading audit with ID:', params.id)
        console.log('Current user:', user?.id)

        if (!user?.id) {
          console.log('No user found, redirecting to sign in')
          setError('Please sign in to view audits')
          return
        }

        // Fetch the audit data directly
        console.log('Fetching audit data for user:', user.id, 'audit:', params.id)
        const { data: auditData, error: auditError } = await supabase
          .from('audits')
          .select(`
            id,
            user_id,
            business_email,
            domain,
            website_url,
            analysis_types,
            status,
            overall_score,
            results,
            report_html,
            error_message,
            completed_at,
            created_at,
            updated_at
          `)
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()

        console.log('Audit data:', auditData)
        console.log('Audit error:', auditError)

        if (auditError) {
          console.error('Audit fetch error:', auditError)
          if (auditError.code === 'PGRST116') {
            setError('Audit not found or access denied')
          } else {
            setError(`Failed to fetch audit: ${auditError.message}`)
          }
          return
        }

        if (!auditData) {
          setError('Audit not found')
          return
        }

        setAudit(auditData as any)
        console.log('Audit loaded successfully:', (auditData as any)?.id)
      } catch (err) {
        console.error('Error loading audit:', err)
        setError('Failed to load audit')
      } finally {
        setLoading(false)
      }
    }

    if (params.id && !authLoading) {
      console.log('Params ID found and auth ready:', params.id)
      loadAudit()
    } else if (!params.id) {
      console.log('No params ID found')
      setError('No audit ID provided')
      setLoading(false)
    }
  }, [params.id, user, authLoading])

  const downloadPDF = async () => {
    if (!audit || !user) return

    try {
      console.log('Starting PDF download...')
      const response = await fetch(`/api/audit/download?auditId=${audit.id}&userId=${user.id}`)
      
      console.log('Response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Download failed:', errorText)
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`)
      }

      // Handle base64 JSON response
      const data = await response.json()
      console.log('JSON response received:', {
        success: data.success,
        filename: data.filename,
        size: data.size,
        pdfLength: data.pdf?.length || 0
      })
      
      if (!data.success || !data.pdf) {
        throw new Error('Invalid response format')
      }

      // Convert base64 to blob
      const binaryString = atob(data.pdf)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' })
      console.log('Blob created from base64:', {
        size: blob.size,
        type: blob.type
      })
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file')
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = data.filename || `AI-Audit-Report-${audit.domain}-${new Date(audit.created_at).toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      
      console.log('PDF download initiated successfully')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to download PDF: ${errorMessage}`)
    }
  }

  const shareAudit = async () => {
    if (!audit) return

    const shareData = {
      title: `AI Audit Report - ${audit.domain}`,
      text: `Check out this AI readiness audit report for ${audit.domain} (Score: ${audit.overall_score}/100)`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">
            {authLoading ? 'Authenticating...' : 'Loading audit report...'}
          </p>
          <p className="mt-2 text-xs text-gray-500">Audit ID: {params.id}</p>
        </div>
      </div>
    )
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Audit Not Found</h1>
          <p className="text-gray-400 mb-2">{error || 'The requested audit could not be found.'}</p>
          <p className="text-xs text-gray-500 mb-4">
            Audit ID: {params.id}<br/>
            User ID: {user?.id || 'Not logged in'}<br/>
            Error: {error}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                <span className="font-medium">Score:</span> 
                <span className="text-white ml-1">{audit.overall_score}/100</span>
              </div>
              
              <button
                onClick={shareAudit}
                className="inline-flex items-center px-3 py-2 border border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-slate-700 hover:bg-slate-600"
              >
                <ShareIcon className="w-4 h-4 mr-2" />
                Share
              </button>
              
              <button
                onClick={downloadPDF}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Info Bar */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white">
                AI Audit Report - {audit.domain}
              </h1>
              <p className="text-sm text-gray-400">
                {audit.business_email} • 
                Generated on {new Date(audit.created_at).toLocaleDateString()} •
                {audit.analysis_types?.length || 0} parameters analyzed
              </p>
            </div>
            
            <div className="flex items-center">
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                audit.status === 'completed' 
                  ? 'bg-green-500/20 text-green-400'
                  : audit.status === 'processing'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {audit.status.charAt(0).toUpperCase() + audit.status.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {audit.status === 'completed' ? (
          <>
            {audit.report_html && audit.report_html.trim().length > 0 ? (
              /* Full HTML Report */
              <div className="bg-white rounded-lg shadow-sm border">
                <div 
                  className="report-container"
                  dangerouslySetInnerHTML={{ __html: audit.report_html }}
                  style={{
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            ) : audit.results ? (
              /* Fallback: Basic Results Display */
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Audit Results</h3>
                  <p className="text-gray-400">Overall Score: <span className="text-white font-medium">{audit.overall_score}/100</span></p>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-white mb-4">Raw Results Data</h4>
                  <pre className="text-sm text-gray-300 overflow-auto max-h-96 bg-slate-900 p-4 rounded">
                    {JSON.stringify(audit.results, null, 2)}
                  </pre>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ This audit doesn't have a formatted HTML report. The raw results are displayed above.
                    This might happen with older audits or if there was an issue generating the report.
                  </p>
                </div>
              </div>
            ) : (
              /* No Results Available */
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
                <h3 className="text-lg font-medium text-white mb-2">No Report Available</h3>
                <p className="text-gray-400 mb-4">
                  This audit is marked as completed but has no report data available.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Start New Audit
                </Link>
              </div>
            )}
          </>
        ) : audit.status === 'processing' ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-white mb-2">Processing Your Audit</h3>
            <p className="text-gray-400">
              We're analyzing your business and generating insights. This usually takes 1-2 minutes.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200"
            >
              Refresh Status
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <h3 className="text-lg font-medium text-white mb-2">Audit Failed</h3>
            <p className="text-gray-400 mb-4">
              There was an issue processing your audit. Please try running it again.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Start New Audit
            </Link>
          </div>
        )}
      </div>

      {/* Custom styles for the embedded report */}
      <style jsx global>{`
        .report-container {
          /* Reset some styles that might conflict */
          line-height: 1.6;
        }
        
        .report-container .container {
          max-width: none !important;
          margin: 0 !important;
          padding: 2rem !important;
        }
        
        .report-container .header {
          margin-bottom: 2rem !important;
        }
        
        .report-container .section {
          margin-bottom: 2rem !important;
        }
        
        /* Ensure responsive behavior */
        @media (max-width: 768px) {
          .report-container .container {
            padding: 1rem !important;
          }
          
          .report-container .parameter-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

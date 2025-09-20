'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    if (sessionId) {
      // You could fetch session details from Stripe here if needed
      setLoading(false)
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">AI</span>
                </div>
                <span className="ml-3 text-white text-xl font-bold">AuditAnalysis</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Success Content */}
      <main className="relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-400" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Welcome to LeadAI!
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Your subscription has been successfully activated. You now have access to comprehensive AI audits 
              that will help you turn every business email into a qualified lead.
            </p>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-600 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">What's Next?</h2>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div>
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-primary-400 font-bold">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Run Your First Audit</h3>
                  <p className="text-gray-300 text-sm">
                    Enter any business email to generate a comprehensive 7-parameter AI readiness report.
                  </p>
                </div>
                
                <div>
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-primary-400 font-bold">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Generate Leads</h3>
                  <p className="text-gray-300 text-sm">
                    Use audit insights to identify automation opportunities and pitch AI solutions.
                  </p>
                </div>
                
                <div>
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-primary-400 font-bold">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Close More Deals</h3>
                  <p className="text-gray-300 text-sm">
                    Present professional reports with specific recommendations to convert prospects.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/new-audit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                Start Your First Audit
              </Link>
              <Link
                href="/dashboard"
                className="border border-gray-600 hover:border-gray-500 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>

            {sessionId && (
              <div className="mt-8 text-sm text-gray-400">
                <p>Session ID: {sessionId}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">AI</span>
              </div>
              <span className="ml-2 text-white font-semibold">LeadAI</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 LeadAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

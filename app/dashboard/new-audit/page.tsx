'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ServerIcon,
  ShieldCheckIcon,
  CogIcon,
} from '@heroicons/react/24/outline'

const analysisTypes = [
  {
    id: 'website_analysis',
    name: 'Website Analysis',
    description: 'Comprehensive analysis of your website\'s AI integration potential',
    icon: GlobeAltIcon,
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'AI-powered analysis of your social media presence and content strategy',
    icon: ChatBubbleLeftRightIcon,
    color: 'bg-purple-500/20 text-purple-400',
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Identify processes ready for AI automation to increase efficiency',
    icon: CogIcon,
    color: 'bg-green-500/20 text-green-400',
  },
  {
    id: 'competitors',
    name: 'Competitors',
    description: 'AI-driven competitive analysis to identify market opportunities',
    icon: ChartBarIcon,
    color: 'bg-orange-500/20 text-orange-400',
  },
  {
    id: 'data_readiness',
    name: 'Data Readiness',
    description: 'Assessment of your data infrastructure for AI implementation',
    icon: ServerIcon,
    color: 'bg-cyan-500/20 text-cyan-400',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'GDPR and regulatory compliance assessment for AI adoption',
    icon: ShieldCheckIcon,
    color: 'bg-red-500/20 text-red-400',
  },
  {
    id: 'ai_opportunity',
    name: 'AI Opportunity',
    description: 'Comprehensive AI opportunity scoring and recommendations',
    icon: MagnifyingGlassIcon,
    color: 'bg-yellow-500/20 text-yellow-400',
  },
]

export default function NewAuditPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [businessEmail, setBusinessEmail] = useState('')
  const [selectedAnalysisTypes, setSelectedAnalysisTypes] = useState<string[]>([
    'website_analysis',
    'social_media',
    'operations',
    'competitors',
    'data_readiness',
    'compliance',
    'ai_opportunity'
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const [auditResult, setAuditResult] = useState(null)

  // Check if user is authenticated when email is entered
  useEffect(() => {
    if (businessEmail && !user) {
      setShowSignupPrompt(true)
    } else {
      setShowSignupPrompt(false)
    }
  }, [businessEmail, user])

  const handleAnalysisTypeToggle = (typeId: string) => {
    setSelectedAnalysisTypes(prev => {
      if (prev.includes(typeId)) {
        return prev.filter(id => id !== typeId)
      } else {
        return [...prev, typeId]
      }
    })
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const extractDomainFromEmail = (email: string) => {
    const domain = email.split('@')[1]
    return `https://${domain}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validateEmail(businessEmail)) {
      setError('Please enter a valid business email address')
      setLoading(false)
      return
    }

    if (selectedAnalysisTypes.length === 0) {
      setError('Please select at least one analysis type')
      setLoading(false)
      return
    }

    // Check user's subscription limits
    if (!user) {
      setShowSignupPrompt(true)
      setLoading(false)
      return
    }

    try {
      // Call the new audit API
      const response = await fetch('/api/audit/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessEmail,
          analysisTypes: selectedAnalysisTypes,
          userId: user!.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Audit failed')
      }

      if (data.status === 'completed') {
        // Redirect to audit results page
        router.push(`/dashboard/audits/${data.auditId}`)
      } else {
        // Redirect to audit details page (processing state)
        router.push(`/dashboard/audits/${data.auditId}`)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Show signup prompt if user entered email but isn't authenticated
  if (showSignupPrompt) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Analyze {businessEmail}?
          </h2>
          <p className="text-gray-300 mb-6">
            Sign up now to get your comprehensive AI readiness audit and discover growth opportunities for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/auth/signup?email=${encodeURIComponent(businessEmail)}`}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Sign Up & Get Audit
            </Link>
            <Link
              href={`/auth/signin?email=${encodeURIComponent(businessEmail)}`}
              className="border border-gray-600 hover:border-gray-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">New Audit</h1>
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-primary-600 text-white' : 'bg-slate-700 text-gray-400'
          }`}>
            1
          </div>
          <div className="text-sm text-gray-400">Processing</div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Business Email Input */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Enter your business email
            </h2>
            <p className="text-gray-400 mb-6">
              We'll extract the domain from your email and analyze your business based on Website
              Analysis, Social Media & Digital Presence, Business Operations Mapping, Competitor &
              Industry Benchmarking, Data Readiness Assessment, Compliance & Risk Profiling, AI
              Opportunity Scoring.
            </p>

            <div>
              <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-300 mb-2">
                Business Email Address
              </label>
              <input
                type="email"
                id="businessEmail"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="your.email@yourcompany.com"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Our systems will automatically identify and analyze your top competitors.
              </p>
            </div>
          </div>

          {/* Analysis Types */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Analysis Types</h2>
            <p className="text-gray-400 mb-6">
              Your plan includes access to all 6 parameters. All parameters will be analyzed in this audit.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisTypes.map((type) => {
                const isSelected = selectedAnalysisTypes.includes(type.id)
                const Icon = type.icon

                return (
                  <div
                    key={type.id}
                    onClick={() => handleAnalysisTypeToggle(type.id)}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white">{type.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">{type.description}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-700">
            <div className="text-sm text-gray-400">
              This audit will use 1 credit from your account.
              <br />
              Credits remaining: {profile?.audit_credits || 0}
            </div>
            <button
              type="submit"
              disabled={loading || !businessEmail || selectedAnalysisTypes.length === 0}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Analyzing Now...' : 'Analyze Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

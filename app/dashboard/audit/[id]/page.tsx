'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Audit } from '@/types/database'
import { getReadinessLevel, formatDateTime } from '@/lib/validations'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  ServerIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const analysisTypeIcons = {
  website_analysis: GlobeAltIcon,
  social_media: ChatBubbleLeftRightIcon,
  operations: CogIcon,
  competitors: ChartBarIcon,
  data_readiness: ServerIcon,
  compliance: ShieldCheckIcon,
  ai_opportunity: MagnifyingGlassIcon,
}

export default function AuditReportPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [audit, setAudit] = useState<Audit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && params.id) {
      fetchAudit()
    }
  }, [user, params.id])

  const fetchAudit = async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      
      if (!data) {
        setError('Audit not found')
        return
      }

      setAudit(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error || !audit) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Report</h2>
          <p className="text-gray-400 mb-6">{error || 'Audit not found'}</p>
          <button
            onClick={() => router.back()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (audit.status !== 'completed') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <InformationCircleIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Report Not Ready</h2>
          <p className="text-gray-400 mb-6">
            This audit is still {audit.status}. Please check back later.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const readinessInfo = getReadinessLevel(audit.ai_readiness_score)
  const results = audit.results as any

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Audit History
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Readiness Report</h1>
            <p className="text-gray-400">
              {audit.website_url || audit.business_email} • {formatDateTime(audit.created_at)}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${readinessInfo.color}`}>
              {audit.ai_readiness_score}/100
            </div>
            <div className={`text-sm ${readinessInfo.color}`}>
              {readinessInfo.label}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
        <div className="flex items-center mb-4">
          <ChartBarIcon className="h-6 w-6 text-primary-400 mr-3" />
          <h2 className="text-xl font-semibold text-white">Overall AI Readiness</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                audit.ai_readiness_score! >= 80 ? 'bg-green-500/20' :
                audit.ai_readiness_score! >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'
              }`}>
                <span className={`text-2xl font-bold ${readinessInfo.color}`}>
                  {audit.ai_readiness_score}
                </span>
              </div>
              <div className="ml-4">
                <h3 className={`text-lg font-semibold ${readinessInfo.color}`}>
                  {readinessInfo.label}
                </h3>
                <div className="w-48 bg-slate-700 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      audit.ai_readiness_score! >= 80 ? 'bg-green-500' :
                      audit.ai_readiness_score! >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${audit.ai_readiness_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Assessment</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              {readinessInfo.description}
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Types */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">Analysis Coverage</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audit.analysis_types.map((type) => {
            const Icon = analysisTypeIcons[type as keyof typeof analysisTypeIcons] || InformationCircleIcon
            return (
              <div key={type} className="flex items-center p-3 bg-slate-700/50 rounded-lg">
                <Icon className="h-5 w-5 text-primary-400 mr-3" />
                <span className="text-white capitalize">{type.replace('_', ' ')}</span>
                <CheckCircleIcon className="h-4 w-4 text-green-400 ml-auto" />
              </div>
            )
          })}
        </div>
      </div>

      {/* Recommendations */}
      {results?.recommendations && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Key Recommendations</h2>
          <div className="space-y-4">
            {results.recommendations.map((recommendation: string, index: number) => (
              <div key={index} className="flex items-start p-4 bg-slate-700/50 rounded-lg">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-gray-300 ml-4">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      {results?.analysis && (
        <div className="space-y-8">
          {/* Website Analysis */}
          {results.analysis.website && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center mb-6">
                <GlobeAltIcon className="h-6 w-6 text-blue-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">Website Analysis</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Overall Score</span>
                      <span className="text-white font-medium">{results.analysis.website.score}/100</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          results.analysis.website.score >= 80 ? 'bg-green-500' :
                          results.analysis.website.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${results.analysis.website.score}%` }}
                      ></div>
                    </div>
                  </div>

                  {results.analysis.website.performance && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white">Performance Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Load Time:</span>
                          <span className="text-white">{results.analysis.website.performance.loadTime?.toFixed(1)}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Mobile Optimized:</span>
                          <span className={results.analysis.website.performance.mobileOptimized ? 'text-green-400' : 'text-red-400'}>
                            {results.analysis.website.performance.mobileOptimized ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">SEO Score:</span>
                          <span className="text-white">{results.analysis.website.performance.seoScore}/100</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {results.analysis.website.technology && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white mb-3">Technology Stack</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">CMS:</span>
                          <span className="text-white">{results.analysis.website.technology.cms || 'Not detected'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Analytics:</span>
                          <span className={results.analysis.website.technology.analytics ? 'text-green-400' : 'text-red-400'}>
                            {results.analysis.website.technology.analytics ? 'Enabled' : 'Missing'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Chatbot:</span>
                          <span className={results.analysis.website.technology.chatbot ? 'text-green-400' : 'text-red-400'}>
                            {results.analysis.website.technology.chatbot ? 'Present' : 'Missing'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {results.analysis.website.issues && results.analysis.website.issues.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-400 mb-2">Issues</h4>
                        <ul className="text-xs text-gray-400 space-y-1">
                          {results.analysis.website.issues.map((issue: string, idx: number) => (
                            <li key={idx}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {results.analysis.website.opportunities && results.analysis.website.opportunities.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-green-400 mb-2">Opportunities</h4>
                        <ul className="text-xs text-gray-400 space-y-1">
                          {results.analysis.website.opportunities.map((opportunity: string, idx: number) => (
                            <li key={idx}>• {opportunity}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social Media Analysis */}
          {results.analysis.social_media && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center mb-6">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">Social Media Analysis</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Overall Score</span>
                      <span className="text-white font-medium">{results.analysis.social_media.score}/100</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          results.analysis.social_media.score >= 80 ? 'bg-green-500' :
                          results.analysis.social_media.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${results.analysis.social_media.score}%` }}
                      ></div>
                    </div>
                  </div>

                  {results.analysis.social_media.platforms && (
                    <div>
                      <h4 className="text-sm font-medium text-white mb-3">Platform Presence</h4>
                      <div className="space-y-2">
                        {results.analysis.social_media.platforms.map((platform: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{platform.name}:</span>
                            <span className={platform.present ? 'text-green-400' : 'text-red-400'}>
                              {platform.present ? '✓ Active' : '✗ Missing'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {results.analysis.social_media.issues && results.analysis.social_media.issues.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-400 mb-2">Issues</h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {results.analysis.social_media.issues.map((issue: string, idx: number) => (
                          <li key={idx}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.analysis.social_media.opportunities && results.analysis.social_media.opportunities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-2">Opportunities</h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {results.analysis.social_media.opportunities.map((opportunity: string, idx: number) => (
                          <li key={idx}>• {opportunity}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Operations Analysis */}
          {results.analysis.operations && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center mb-6">
                <CogIcon className="h-6 w-6 text-green-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">Operations Analysis</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Overall Score</span>
                      <span className="text-white font-medium">{results.analysis.operations.score}/100</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          results.analysis.operations.score >= 80 ? 'bg-green-500' :
                          results.analysis.operations.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${results.analysis.operations.score}%` }}
                      ></div>
                    </div>
                  </div>

                  {results.analysis.operations.digitalMaturity && (
                    <div>
                      <h4 className="text-sm font-medium text-white mb-3">Digital Maturity</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cloud Adoption:</span>
                          <span className="text-white">{results.analysis.operations.digitalMaturity.cloudAdoption}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Data Management:</span>
                          <span className="text-white">{results.analysis.operations.digitalMaturity.dataManagement}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Process Automation:</span>
                          <span className="text-white">{results.analysis.operations.digitalMaturity.processAutomation}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {results.analysis.operations.issues && results.analysis.operations.issues.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-400 mb-2">Issues</h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {results.analysis.operations.issues.map((issue: string, idx: number) => (
                          <li key={idx}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.analysis.operations.opportunities && results.analysis.operations.opportunities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-2">Opportunities</h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {results.analysis.operations.opportunities.map((opportunity: string, idx: number) => (
                          <li key={idx}>• {opportunity}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Opportunity Analysis */}
          {results.analysis.ai_opportunity && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center mb-6">
                <MagnifyingGlassIcon className="h-6 w-6 text-yellow-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">AI Opportunity Analysis</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">AI Readiness Score</span>
                      <span className="text-white font-medium">{results.analysis.ai_opportunity.score}/100</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          results.analysis.ai_opportunity.score >= 80 ? 'bg-green-500' :
                          results.analysis.ai_opportunity.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${results.analysis.ai_opportunity.score}%` }}
                      ></div>
                    </div>
                  </div>

                  {results.analysis.ai_opportunity.readinessFactors && (
                    <div>
                      <h4 className="text-sm font-medium text-white mb-3">Readiness Factors</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Data:</span>
                          <span className="text-white">{results.analysis.ai_opportunity.readinessFactors.data}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Technology:</span>
                          <span className="text-white">{results.analysis.ai_opportunity.readinessFactors.technology}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Skills:</span>
                          <span className="text-white">{results.analysis.ai_opportunity.readinessFactors.skills}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Culture:</span>
                          <span className="text-white">{results.analysis.ai_opportunity.readinessFactors.culture}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {results.analysis.ai_opportunity.useCases && results.analysis.ai_opportunity.useCases.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white mb-3">Recommended Use Cases</h4>
                      <div className="space-y-3">
                        {results.analysis.ai_opportunity.useCases.map((useCase: any, idx: number) => (
                          <div key={idx} className="bg-slate-700/50 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-white">{useCase.name}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                useCase.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                useCase.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {useCase.priority}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>Feasibility: {useCase.feasibility}%</span>
                              <span>Impact: {useCase.impact}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Ready for the Next Step?</h2>
        <p className="text-primary-100 mb-6">
          Based on your AI readiness assessment, we can help you implement these recommendations 
          and accelerate your AI transformation journey.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="bg-white hover:bg-gray-100 text-primary-600 px-6 py-2 rounded-lg font-medium transition-colors">
            Schedule Consultation
          </button>
          <button className="border border-primary-200 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Download Report
          </button>
        </div>
      </div>
    </div>
  )
}

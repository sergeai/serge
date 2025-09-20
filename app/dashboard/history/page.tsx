'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Audit } from '@/types/database'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

export default function AuditHistoryPage() {
  const { user } = useAuth()
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Reviews')

  useEffect(() => {
    if (user) {
      fetchAudits()
    }
  }, [user])

  const fetchAudits = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log('Fetched audits:', data)
      data?.forEach((audit: any, index) => {
        console.log(`Audit ${index + 1}:`, {
          id: audit.id,
          status: audit.status,
          ai_readiness_score: audit.ai_readiness_score,
          overall_score: (audit as any).overall_score,
          final_score: getScore(audit),
          business_email: audit.business_email,
          readiness_label: getReadinessLabel(audit)
        })
      })
      
      setAudits(data || [])
    } catch (error) {
      console.error('Error fetching audits:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAudits = audits.filter((audit) => {
    const matchesSearch = 
      audit.business_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (audit.website_url && audit.website_url.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = statusFilter === 'All Reviews' || audit.status === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/10'
      case 'processing':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'failed':
        return 'text-red-400 bg-red-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  // Helper function to get the score from either new or old field
  const getScore = (audit: any): number | null => {
    return audit.ai_readiness_score ?? (audit as any).overall_score ?? null
  }

  const getReadinessColor = (audit: any) => {
    const score = getScore(audit)
    if (score === null) return 'text-gray-400'
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getReadinessLabel = (audit: any) => {
    const score = getScore(audit)
    if (score === null) return 'Pending'
    if (score >= 80) return 'AI Resilient'
    if (score >= 60) return 'AI Adaptable'
    return 'AI Vulnerable'
  }

  const getReadinessDescription = (audit: any) => {
    const score = getScore(audit)
    if (score === null) return 'Analysis in progress'
    if (score >= 80) return 'Your business is already leveraging digital tools effectively and is well-positioned for AI adoption.'
    if (score >= 60) return 'Your business has a solid digital foundation but needs some adjustments to fully leverage AI technologies.'
    return 'Your business may be lacking key digital infrastructure or data practices needed for effective AI implementation.'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit History</h1>
          <p className="text-gray-400">View and manage all your previous AI audits</p>
        </div>
        <Link
          href="/dashboard/new-audit"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Audit
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            >
              <option value="All Reviews">All Reviews</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audits List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredAudits.length > 0 ? (
          <div className="divide-y divide-slate-700">
            {filteredAudits.map((audit) => (
              <div key={audit.id} className="p-6 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-medium text-white">
                          {audit.website_url || audit.business_email}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(audit.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            audit.status
                          )}`}
                        >
                          {audit.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getReadinessColor(audit)}`}>
                        {getReadinessLabel(audit)}
                      </div>
                      {getScore(audit) && (
                        <div className="text-xs text-gray-400 mt-1">
                          Score: {getScore(audit)}/100
                        </div>
                      )}
                    </div>
                    {audit.status === 'completed' && (
                      <Link
                        href={`/dashboard/audits/${audit.id}`}
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                      >
                        View Report
                      </Link>
                    )}
                  </div>
                </div>
                
                {getScore(audit) && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-sm text-gray-400">
                      {getReadinessDescription(audit)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No audits found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || statusFilter !== 'All Reviews'
                ? 'No audits match your current filters.'
                : 'Start a new audit to see results here.'}
            </p>
            <Link
              href="/dashboard/new-audit"
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Start a new audit
            </Link>
          </div>
        )}
      </div>

      {/* AI Readiness Scores Legend */}
      <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Understanding AI Readiness Scores</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full mt-1.5"></div>
            <div>
              <h4 className="text-sm font-medium text-green-400">AI Resilient</h4>
              <p className="text-xs text-gray-400 mt-1">
                Your business is already leveraging digital tools effectively and is well-positioned for AI adoption.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mt-1.5"></div>
            <div>
              <h4 className="text-sm font-medium text-yellow-400">AI Adaptable</h4>
              <p className="text-xs text-gray-400 mt-1">
                Your business has a solid digital foundation but needs some adjustments to fully leverage AI technologies.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 bg-red-400 rounded-full mt-1.5"></div>
            <div>
              <h4 className="text-sm font-medium text-red-400">AI Vulnerable</h4>
              <p className="text-xs text-gray-400 mt-1">
                Your business may be lacking key digital infrastructure or data practices needed for effective AI implementation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

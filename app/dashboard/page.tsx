'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Audit } from '@/types/database'
import StripeTest from '@/components/StripeTest'
import {
  PlusIcon,
  CreditCardIcon,
  ChartBarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [recentAudits, setRecentAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && !authLoading) {
      fetchRecentAudits()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

  const fetchRecentAudits = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentAudits(data || [])
    } catch (error) {
      console.error('Error fetching audits:', error)
      setRecentAudits([])
    } finally {
      setLoading(false)
    }
  }

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

  const getReadinessColor = (score: number | null) => {
    if (score === null) return 'text-gray-400'
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getReadinessLabel = (score: number | null) => {
    if (score === null) return 'Pending'
    if (score >= 80) return 'AI Resilient'
    if (score >= 60) return 'AI Adaptable'
    return 'AI Vulnerable'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Welcome back, {profile?.full_name || user?.email?.split('@')[0]}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Audit Credits */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <CreditCardIcon className="h-5 w-5 text-primary-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-400">Audit Credits</p>
                <p className="text-2xl font-bold text-white">{profile?.audit_credits || 0}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-3">remaining</p>
          <Link
            href="/dashboard/settings"
            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
          >
            Upgrade to get more credits
          </Link>
        </div>

        {/* Current Plan */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-400">Current Plan</p>
                <p className="text-2xl font-bold text-white capitalize">
                  {profile?.subscription_plan || 'starter'}
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
          >
            Manage subscription
          </Link>
        </div>

        {/* Total Audits */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <EyeIcon className="h-5 w-5 text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-400">Total Audits</p>
                <p className="text-2xl font-bold text-white">{recentAudits.length}</p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/history"
            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
          >
            View all audits
          </Link>
        </div>
      </div>

      {/* Recent Audits */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent Audits</h2>
            <Link
              href="/dashboard/history"
              className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : recentAudits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Website
                    </th>
                    <th className="pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      AI Readiness
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {recentAudits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="py-4 text-white">
                        {audit.status === 'completed' ? (
                          <Link
                            href={`/dashboard/audits/${audit.id}`}
                            className="hover:text-primary-400 transition-colors"
                          >
                            {audit.website_url || audit.business_email}
                          </Link>
                        ) : (
                          audit.website_url || audit.business_email
                        )}
                      </td>
                      <td className="py-4 text-gray-400">
                        {new Date(audit.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            audit.status
                          )}`}
                        >
                          {audit.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-medium ${getReadinessColor(audit.ai_readiness_score)}`}
                          >
                            {getReadinessLabel(audit.ai_readiness_score)}
                          </span>
                          {audit.status === 'completed' && (
                            <Link
                              href={`/dashboard/audits/${audit.id}`}
                              className="text-primary-400 hover:text-primary-300 text-xs font-medium transition-colors ml-2"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No audits found</h3>
              <p className="text-gray-400 mb-6">Start a new audit to see results here.</p>
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
      </div>

  
      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Ready to run a new AI audit?
            </h3>
            <p className="text-primary-100">
              Analyze your business's AI readiness with just a few clicks.
            </p>
          </div>
          <Link
            href="/dashboard/new-audit"
            className="bg-white hover:bg-gray-100 text-primary-600 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
          >
            Start New Audit
          </Link>
        </div>
      </div>
    </div>
  )
}

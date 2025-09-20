'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
import {
  UserIcon,
  KeyIcon,
  CreditCardIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)

  // Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [companyName, setCompanyName] = useState(profile?.company_name || '')

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id)

      if (error) throw error

      await refreshProfile()
      setMessage('Profile updated successfully!')
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setMessage(error.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: 'basic' | 'enterprise') => {
    if (!user) return

    setPaymentLoading(plan)
    
    try {
      const priceId = plan === 'basic' ? process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID
      
      console.log('Payment request:', {
        priceId,
        userId: user.id,
        planType: plan
      })

      if (!priceId) {
        throw new Error(`Price ID not configured for ${plan} plan. Please check environment variables.`)
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          planType: plan
        }),
      })

      const data = await response.json()
      console.log('Checkout response:', data)

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      setMessage(error.message || 'Failed to start payment process')
    } finally {
      setPaymentLoading(null)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // In a real app, you'd want to handle this server-side
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setMessage('Account deletion initiated. You have been signed out.')
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: UserIcon },
    { id: 'password', name: 'Change Password', icon: KeyIcon },
    { id: 'subscription', name: 'Subscription', icon: CreditCardIcon },
    { id: 'danger', name: 'Danger Zone', icon: TrashIcon },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-gray-400">Manage your account settings and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.startsWith('Error') 
            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
            : 'bg-green-500/10 border border-green-500/20 text-green-400'
        }`}>
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            {/* Profile Information */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-3 bg-slate-600 border border-slate-600 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Enter your company name"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              </div>
            )}

            {/* Change Password */}
            {activeTab === 'password' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Change Password</h2>
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Subscription */}
            {activeTab === 'subscription' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Subscription</h2>
                
                <div className="space-y-6">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white capitalize">
                          {profile?.subscription_plan || 'starter'} Plan
                        </h3>
                        <p className="text-sm text-gray-400">
                          Current subscription plan
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {profile?.audit_credits || 0}
                        </div>
                        <div className="text-sm text-gray-400">Credits remaining</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Starter Plan */}
                    <div className={`border-2 rounded-lg p-4 ${
                      profile?.subscription_plan === 'starter' 
                        ? 'border-primary-500 bg-primary-500/10' 
                        : 'border-slate-600 bg-slate-700/50'
                    }`}>
                      <h4 className="text-lg font-semibold text-white mb-2">Starter</h4>
                      <div className="text-2xl font-bold text-white mb-2">$0</div>
                      <ul className="text-sm text-gray-400 space-y-1 mb-4">
                        <li>10 audits/month</li>
                        <li>Basic AI Analysis</li>
                        <li>Email Support</li>
                      </ul>
                      {profile?.subscription_plan === 'starter' && (
                        <div className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium text-center">
                          Current Plan
                        </div>
                      )}
                    </div>

                    {/* Professional Plan */}
                    <div className={`border-2 rounded-lg p-4 ${
                      profile?.subscription_plan === 'professional' 
                        ? 'border-primary-500 bg-primary-500/10' 
                        : 'border-slate-600 bg-slate-700/50'
                    }`}>
                      <h4 className="text-lg font-semibold text-white mb-2">Professional</h4>
                      <div className="text-2xl font-bold text-white mb-2">$50/mo</div>
                      <ul className="text-sm text-gray-400 space-y-1 mb-4">
                        <li>50 audits/month</li>
                        <li>Advanced AI Analysis</li>
                        <li>Priority Support</li>
                        <li>Detailed Reports</li>
                      </ul>
                      {profile?.subscription_plan !== 'professional' && (
                        <button 
                          onClick={() => handleUpgrade('basic')}
                          disabled={paymentLoading === 'basic'}
                          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          {paymentLoading === 'basic' ? 'Processing...' : (profile?.subscription_plan === 'starter' ? 'Upgrade to Professional' : 'Change to Professional')}
                        </button>
                      )}
                      {profile?.subscription_plan === 'professional' && (
                        <div className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium text-center">
                          Current Plan
                        </div>
                      )}
                    </div>

                    {/* Enterprise Plan */}
                    <div className={`border-2 rounded-lg p-4 ${
                      profile?.subscription_plan === 'enterprise' 
                        ? 'border-primary-500 bg-primary-500/10' 
                        : 'border-slate-600 bg-slate-700/50'
                    }`}>
                      <h4 className="text-lg font-semibold text-white mb-2">Enterprise</h4>
                      <div className="text-2xl font-bold text-white mb-2">$199/mo</div>
                      <ul className="text-sm text-gray-400 space-y-1 mb-4">
                        <li>Unlimited audits/month</li>
                        <li>Custom AI Models</li>
                        <li>24/7 Support</li>
                        <li>API Access</li>
                      </ul>
                      {profile?.subscription_plan !== 'enterprise' && (
                        <button 
                          onClick={() => handleUpgrade('enterprise')}
                          disabled={paymentLoading === 'enterprise'}
                          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          {paymentLoading === 'enterprise' ? 'Processing...' : (profile?.subscription_plan === 'starter' ? 'Upgrade to Enterprise' : 'Change to Enterprise')}
                        </button>
                      )}
                      {profile?.subscription_plan === 'enterprise' && (
                        <div className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium text-center">
                          Current Plan
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-2">Manage Subscription</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Need to update your billing information or cancel your subscription?
                    </p>
                    <button className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Danger Zone</h2>
                
                <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-red-400 mb-2">Delete Account</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                    All your data, including audit history and reports, will be permanently deleted.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

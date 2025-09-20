'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function StripeTest() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const testCheckout = async (planType: 'basic' | 'enterprise') => {
    if (!user) {
      setMessage('Please sign in first')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const priceId = planType === 'basic' 
        ? process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          planType
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error } = await stripe.redirectToCheckout({ 
        sessionId: data.sessionId 
      })

      if (error) {
        throw new Error(error.message)
      }

    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">Stripe Integration Test</h3>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${
          message.startsWith('Error') 
            ? 'bg-red-500/20 text-red-400' 
            : 'bg-green-500/20 text-green-400'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={() => testCheckout('basic')}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded"
        >
          {loading ? 'Loading...' : 'Test Basic Plan ($50/month)'}
        </button>

        <button
          onClick={() => testCheckout('enterprise')}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded"
        >
          {loading ? 'Loading...' : 'Test Enterprise Plan ($199/month)'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <p><strong>User ID:</strong> {user?.id || 'Not signed in'}</p>
        <p><strong>Stripe Publishable Key:</strong> {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}</p>
        <p><strong>Basic Price ID:</strong> {process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || '❌ Missing'}</p>
        <p><strong>Enterprise Price ID:</strong> {process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || '❌ Missing'}</p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckIcon } from '@heroicons/react/24/outline'
import { useCurrency } from '@/lib/currency'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PricingPlan {
  name: string
  price: number
  description: string
  audits: string
  featured: boolean
  features: string[]
  stripePriceId?: string
}

const pricingPlans: PricingPlan[] = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out our AI audit technology',
    audits: '10 audits per month',
    featured: false,
    features: [
      'Website & SEO Analysis',
      'Social & Digital Presence',
      'Basic Business Operations',
      'Competitor Intelligence',
      'Data Readiness Check',
      'Compliance & Risk Assessment',
      'Email Support'
    ]
  },
  {
    name: 'Basic',
    price: 50,
    description: 'Great for small businesses and consultants',
    audits: '50 audits per month',
    featured: true,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    features: [
      'All Free features',
      'Advanced Business Operations',
      'Market Position Analysis',
      'Product Pathway Recommendations',
      'Priority Support',
      'Custom Branding',
      'Export Reports (PDF)',
      'API Access'
    ]
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'For agencies and large organizations',
    audits: 'Unlimited audits',
    featured: false,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      'All Basic features',
      'White-label Solution',
      'Custom Integrations',
      'Dedicated Account Manager',
      'Advanced Analytics',
      'Team Collaboration',
      'SLA Guarantee',
      'Phone Support'
    ]
  }
]

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { currency, loading: currencyLoading, formatPrice } = useCurrency()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      router.push('/auth/signup')
      return
    }

    if (plan.price === 0) {
      // Free plan - redirect to dashboard
      router.push('/dashboard')
      return
    }

    if (!plan.stripePriceId) {
      alert('This plan is not yet available. Please contact support.')
      return
    }

    setLoading(plan.name)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          userId: user.id,
          planType: plan.name.toLowerCase()
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
        throw new Error(error.message || 'Checkout failed')
      }
    } catch (error: any) {
      console.error('Subscription error:', error)
      alert(`Subscription failed: ${error.message}`)
    } finally {
      setLoading(null)
    }
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
              {user ? (
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Pricing Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your business needs. All plans include access to our core AI audit technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-slate-700/50 backdrop-blur-sm rounded-xl p-8 border ${
                  plan.featured ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-600'
                } relative`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-300 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {currencyLoading ? `$${plan.price}` : formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-300">/month</span>
                  </div>
                  <p className="text-primary-400 font-medium mb-6">{plan.audits}</p>
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading === plan.name}
                    className={`block w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                      plan.featured
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-slate-600 hover:bg-slate-500 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading === plan.name ? 'Processing...' : 'Get Started'}
                  </button>
                </div>
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-white mb-4">What's included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-300">
                        <CheckIcon className="h-5 w-5 text-primary-400 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Can I upgrade or downgrade my plan at any time?
                  </h3>
                  <p className="text-gray-300">
                    Yes, you can change your plan at any time. Changes will take effect at the next billing cycle.
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    What happens if I exceed my audit limit?
                  </h3>
                  <p className="text-gray-300">
                    You can upgrade to a higher tier for more audits, or wait until your monthly limit resets.
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Do you offer refunds?
                  </h3>
                  <p className="text-gray-300">
                    We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.
                  </p>
                </div>
              </div>
            </div>
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

'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, CheckIcon, CurrencyDollarIcon, GlobeAltIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { useCurrency } from '@/lib/currency'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface AuditParameter {
  title: string
  description: string
  icon: ({ className }: { className: string }) => JSX.Element
}

interface PricingPlan {
  name: string
  price: number
  description: string
  audits: string
  featured: boolean
  features: string[]
  stripePriceId?: string
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { currency, loading: currencyLoading, formatPrice } = useCurrency()
  const [subscriptionLoading, setSubscriptionLoading] = useState<string | null>(null)

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      router.push('/auth/signup')
      return
    }

    if (plan.price === 0) {
      router.push('/dashboard')
      return
    }

    if (!plan.stripePriceId) {
      alert('This plan is not yet available. Please contact support.')
      return
    }

    setSubscriptionLoading(plan.name)

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
      setSubscriptionLoading(null)
    }
  }

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

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
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">AI</span>
                  </div>
                  <span className="ml-3 text-white text-xl font-bold">AuditAnalysis</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Turn Any Email into a{' '}
              <span className="text-primary-400">Lead</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Our proprietary AI engine is programmed to reveal growth opportunities and competitive gaps by generating business audits that double up as sales leads.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                Start Free Audit
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="border border-gray-600 hover:border-gray-500 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* How the Autonomous AI Audit Works */}
        <section id="features" className="py-20 bg-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                How the Autonomous AI Audit Works
              </h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                Our proprietary AI system runs a 49-question diagnostic that operates completely on its own—no forms or prompts needed. In minutes it generates a branded scorecard and report designed to spark a sales conversation and recommend short-, mid-, and long-term automation strategies a consultant can deliver.
              </p>
            </div>

            <div className="mb-12">
              <p className="text-lg text-gray-300 max-w-4xl mx-auto text-center mb-8">
                The audit measures seven core parameters, each with a readiness score, competitive insights, and actionable recommendations:
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {auditParameters.map((parameter: AuditParameter, index: number) => (
                <div
                  key={index}
                  className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600"
                >
                  <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
                    <parameter.icon className="h-6 w-6 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{parameter.title}</h3>
                  <p className="text-gray-300">{parameter.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-lg text-gray-300 max-w-4xl mx-auto">
                The result is a conversion-focused report that not only shows where you stand but also guides consultants on the exact solutions to implement—turning every audit into a warm, ready-to-close lead.
              </p>
            </div>
          </div>
        </section>

        {/* Three Use Cases Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Three Use Cases
              </h2>
            </div>

            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-600">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
                  <ChartBarIcon className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  1. Businesses Ready to Adopt AI
                </h3>
                <p className="text-gray-300">
                  Companies aiming to cut costs and scale can use the Autonomous AI Readiness Audit Tool to expose inefficiencies and reveal automation opportunities. It delivers a compliant, personalized roadmap to future-proof operations and turn digital systems into a competitive edge.
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-600">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
                  <GlobeAltIcon className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  2. Digital & AI Marketing Agencies
                </h3>
                <p className="text-gray-300">
                  Agencies gain qualified, AI-interested leads plus actionable insights for GDPR-compliant solutions. Each audit equips them to pitch cost-saving, time-efficient strategies that win new clients faster.
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-600">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
                  <CurrencyDollarIcon className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  3. Startups and New Ventures
                </h3>
                <p className="text-gray-300">
                  Founders can audit competitors to validate and refine their models, uncover market gaps, and spot automation ideas—launching stronger and outpacing incumbents from day one.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Choose the plan that fits your business needs. All plans include access to our core AI audit technology.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan: PricingPlan, index: number) => (
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
                      disabled={subscriptionLoading === plan.name}
                      className={`block w-full py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        plan.featured
                          ? 'bg-primary-600 hover:bg-primary-700 text-white'
                          : 'bg-slate-600 hover:bg-slate-500 text-white'
                      }`}
                    >
                      {subscriptionLoading === plan.name ? 'Processing...' : 'Get Started'}
                    </button>
                  </div>
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-white mb-4">What's included:</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature: string, featureIndex: number) => (
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
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Start your free AI readiness audit today and discover opportunities 
              for growth and efficiency.
            </p>
            <Link
              href="/auth/signup"
              className="bg-white hover:bg-gray-100 text-primary-600 px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center"
            >
              Get Started Now
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
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

const auditParameters: AuditParameter[] = [
  {
    title: 'Website & SEO',
    description: 'Evaluates tech stack, trust signals, content clarity, and search performance, with an SEO readiness score and instant improvement plan.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: 'Social & Digital Presence',
    description: 'Analyzes brand voice, content quality, posting cadence, and engagement to grow influence and reach.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    title: 'Business Operations',
    description: 'Maps your service flow and internal processes to spot inefficiencies and automation opportunities for scalable growth.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Competitor Intelligence',
    description: 'Benchmarks your digital footprint against market leaders to expose gaps and create an AI-backed plan to overtake them.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Data Readiness',
    description: 'Reviews CRM usage, analytics, and tracking to boost customer insight and personalization for revenue gains.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
  {
    title: 'Compliance & Risk',
    description: 'Checks privacy policies, cookie notices, and legal safeguards for GDPR and other regulations, reducing legal exposure.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Market Position & Product Pathways',
    description: 'Goes beyond benchmarking to forecast strategic moves, suggesting specific AI tools and consultant-recommended products for immediate automation wins and longer-term relationship building.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
]

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

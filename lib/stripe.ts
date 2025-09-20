import { loadStripe } from '@stripe/stripe-js'
import Stripe from 'stripe'

// Client-side Stripe
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

// Server-side Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Pricing configuration
export const STRIPE_PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_monthly',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
}

// Product configuration
export const PRODUCTS = {
  free: {
    name: 'Free',
    priceId: null,
    price: 0,
    auditsPerMonth: 10,
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
  basic: {
    name: 'Basic',
    priceId: STRIPE_PRICE_IDS.basic,
    price: 50,
    auditsPerMonth: 50,
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
  enterprise: {
    name: 'Enterprise',
    priceId: STRIPE_PRICE_IDS.enterprise,
    price: 199,
    auditsPerMonth: -1, // Unlimited
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
}

export type ProductTier = keyof typeof PRODUCTS

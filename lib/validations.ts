import { z } from 'zod'

// Auth validations
export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Profile validations
export const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  companyName: z.string().optional(),
})

export const passwordChangeSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Audit validations
export const auditSchema = z.object({
  businessEmail: z.string().email('Please enter a valid business email address'),
  analysisTypes: z.array(z.string()).min(1, 'Please select at least one analysis type'),
})

// Utility functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function extractDomainFromEmail(email: string): string {
  const domain = email.split('@')[1]
  return `https://${domain}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getReadinessLevel(score: number | null): {
  label: string
  color: string
  description: string
} {
  if (score === null) {
    return {
      label: 'Pending',
      color: 'text-gray-400',
      description: 'Analysis in progress'
    }
  }
  
  if (score >= 80) {
    return {
      label: 'AI Resilient',
      color: 'text-green-400',
      description: 'Your business is already leveraging digital tools effectively and is well-positioned for AI adoption.'
    }
  }
  
  if (score >= 60) {
    return {
      label: 'AI Adaptable',
      color: 'text-yellow-400',
      description: 'Your business has a solid digital foundation but needs some adjustments to fully leverage AI technologies.'
    }
  }
  
  return {
    label: 'AI Vulnerable',
    color: 'text-red-400',
    description: 'Your business may be lacking key digital infrastructure or data practices needed for effective AI implementation.'
  }
}

export function getStatusColor(status: string): string {
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

export function generateMockAuditResults(score: number) {
  const recommendations = [
    'Implement AI-powered chatbot for customer service automation',
    'Automate data entry and processing workflows',
    'Use AI for content personalization and recommendation systems',
    'Deploy predictive analytics for business forecasting',
    'Integrate AI-driven SEO optimization tools',
    'Implement automated social media content scheduling',
    'Use AI for competitive analysis and market research',
    'Deploy machine learning for fraud detection',
    'Automate invoice processing and financial workflows',
    'Implement AI-powered customer segmentation',
  ]

  const selectedRecommendations = recommendations
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 3) + 3)

  return {
    score,
    recommendations: selectedRecommendations,
    analysis: {
      website: {
        score: Math.floor(Math.random() * 20) + (score - 10),
        issues: ['Slow loading times', 'Poor mobile optimization'],
        opportunities: ['Add AI chatbot', 'Implement personalization']
      },
      social_media: {
        score: Math.floor(Math.random() * 20) + (score - 10),
        issues: ['Inconsistent posting', 'Low engagement'],
        opportunities: ['Automated scheduling', 'AI content generation']
      },
      operations: {
        score: Math.floor(Math.random() * 20) + (score - 10),
        issues: ['Manual processes', 'Data silos'],
        opportunities: ['Process automation', 'Data integration']
      }
    }
  }
}

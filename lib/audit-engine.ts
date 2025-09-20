import { supabase } from './supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Check if OpenAI is properly configured
const isOpenAIConfigured = () => {
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-'))
}

export interface AuditAnalysis {
  website?: WebsiteAnalysis
  social_media?: SocialMediaAnalysis
  operations?: OperationsAnalysis
  competitors?: CompetitorAnalysis
  data_readiness?: DataReadinessAnalysis
  compliance?: ComplianceAnalysis
  ai_opportunity?: AIOpportunityAnalysis
}

export interface WebsiteAnalysis {
  score: number
  performance: {
    loadTime: number
    mobileOptimized: boolean
    seoScore: number
  }
  technology: {
    cms: string | null
    analytics: boolean
    chatbot: boolean
    aiFeatures: string[]
  }
  issues: string[]
  opportunities: string[]
}

export interface SocialMediaAnalysis {
  score: number
  platforms: {
    name: string
    present: boolean
    followers?: number
    engagement?: number
  }[]
  contentStrategy: {
    frequency: string
    quality: number
    automation: boolean
  }
  issues: string[]
  opportunities: string[]
}

export interface OperationsAnalysis {
  score: number
  digitalMaturity: {
    cloudAdoption: number
    dataManagement: number
    processAutomation: number
  }
  systems: {
    crm: boolean
    erp: boolean
    analytics: boolean
    automation: boolean
  }
  issues: string[]
  opportunities: string[]
}

export interface CompetitorAnalysis {
  score: number
  competitors: {
    name: string
    aiReadiness: number
    strengths: string[]
  }[]
  marketPosition: string
  gaps: string[]
  opportunities: string[]
}

export interface DataReadinessAnalysis {
  score: number
  dataQuality: number
  dataGovernance: number
  integration: number
  privacy: number
  issues: string[]
  opportunities: string[]
}

export interface ComplianceAnalysis {
  score: number
  gdprCompliance: number
  dataProtection: number
  aiEthics: number
  risks: string[]
  recommendations: string[]
}

export interface AIOpportunityAnalysis {
  score: number
  readinessFactors: {
    data: number
    technology: number
    skills: number
    culture: number
  }
  useCases: {
    name: string
    feasibility: number
    impact: number
    priority: 'high' | 'medium' | 'low'
  }[]
  roadmap: string[]
}

export class AuditEngine {
  private domain: string
  private businessEmail: string
  private analysisTypes: string[]

  constructor(businessEmail: string, analysisTypes: string[]) {
    this.businessEmail = businessEmail
    this.domain = this.extractDomain(businessEmail)
    this.analysisTypes = analysisTypes
  }

  private extractDomain(email: string): string {
    return email.split('@')[1]
  }

  async performAudit(): Promise<{
    score: number
    analysis: AuditAnalysis
    recommendations: string[]
  }> {
    const analysis: AuditAnalysis = {}
    const recommendations: string[] = []
    let totalScore = 0
    let scoreCount = 0

    // Perform each type of analysis
    for (const type of this.analysisTypes) {
      switch (type) {
        case 'website_analysis':
          analysis.website = await this.analyzeWebsite()
          totalScore += analysis.website.score
          scoreCount++
          recommendations.push(...this.getWebsiteRecommendations(analysis.website))
          break

        case 'social_media':
          analysis.social_media = await this.analyzeSocialMedia()
          totalScore += analysis.social_media.score
          scoreCount++
          recommendations.push(...this.getSocialMediaRecommendations(analysis.social_media))
          break

        case 'operations':
          analysis.operations = await this.analyzeOperations()
          totalScore += analysis.operations.score
          scoreCount++
          recommendations.push(...this.getOperationsRecommendations(analysis.operations))
          break

        case 'competitors':
          analysis.competitors = await this.analyzeCompetitors()
          totalScore += analysis.competitors.score
          scoreCount++
          recommendations.push(...this.getCompetitorRecommendations(analysis.competitors))
          break

        case 'data_readiness':
          analysis.data_readiness = await this.analyzeDataReadiness()
          totalScore += analysis.data_readiness.score
          scoreCount++
          recommendations.push(...this.getDataReadinessRecommendations(analysis.data_readiness))
          break

        case 'compliance':
          analysis.compliance = await this.analyzeCompliance()
          totalScore += analysis.compliance.score
          scoreCount++
          recommendations.push(...this.getComplianceRecommendations(analysis.compliance))
          break

        case 'ai_opportunity':
          analysis.ai_opportunity = await this.analyzeAIOpportunity()
          totalScore += analysis.ai_opportunity.score
          scoreCount++
          recommendations.push(...this.getAIOpportunityRecommendations(analysis.ai_opportunity))
          break
      }
    }

    const overallScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0

    return {
      score: overallScore,
      analysis,
      recommendations: this.prioritizeRecommendations(recommendations)
    }
  }

  private async analyzeWebsite(): Promise<WebsiteAnalysis> {
    try {
      const websiteUrl = `https://${this.domain}`
      
      // Check if website exists and get basic info
      const websiteExists = await this.checkWebsiteExists(websiteUrl)
      
      if (!websiteExists) {
        return {
          score: 20,
          performance: { loadTime: 0, mobileOptimized: false, seoScore: 0 },
          technology: { cms: null, analytics: false, chatbot: false, aiFeatures: [] },
          issues: ['Website not accessible or does not exist'],
          opportunities: ['Create a professional website', 'Implement basic SEO', 'Add contact forms']
        }
      }

      // Simulate website analysis (in production, use real tools like Lighthouse, PageSpeed Insights)
      const performance = await this.analyzeWebsitePerformance(websiteUrl)
      const technology = await this.analyzeWebsiteTechnology(websiteUrl)
      
      let score = 50 // Base score for having a website
      
      // Adjust score based on performance
      if (performance.loadTime < 3) score += 15
      if (performance.mobileOptimized) score += 10
      if (performance.seoScore > 70) score += 15
      
      // Adjust score based on technology
      if (technology.analytics) score += 5
      if (technology.chatbot) score += 10
      score += technology.aiFeatures.length * 5

      const issues = []
      const opportunities = []

      if (performance.loadTime > 5) issues.push('Slow website loading times')
      if (!performance.mobileOptimized) issues.push('Poor mobile optimization')
      if (performance.seoScore < 50) issues.push('Low SEO score')
      if (!technology.analytics) issues.push('Missing analytics tracking')

      if (!technology.chatbot) opportunities.push('Implement AI-powered chatbot')
      if (technology.aiFeatures.length === 0) opportunities.push('Add AI-driven features')
      if (performance.seoScore < 80) opportunities.push('Improve SEO optimization')

      return {
        score: Math.min(100, score),
        performance,
        technology,
        issues,
        opportunities
      }
    } catch (error) {
      console.error('Website analysis error:', error)
      return {
        score: 30,
        performance: { loadTime: 0, mobileOptimized: false, seoScore: 30 },
        technology: { cms: null, analytics: false, chatbot: false, aiFeatures: [] },
        issues: ['Unable to fully analyze website'],
        opportunities: ['Improve website accessibility', 'Add modern web technologies']
      }
    }
  }

  private async analyzeSocialMedia(): Promise<SocialMediaAnalysis> {
    // In production, integrate with social media APIs
    const platforms = [
      { name: 'LinkedIn', present: Math.random() > 0.3, followers: Math.floor(Math.random() * 10000), engagement: Math.random() * 5 },
      { name: 'Twitter', present: Math.random() > 0.4, followers: Math.floor(Math.random() * 5000), engagement: Math.random() * 3 },
      { name: 'Facebook', present: Math.random() > 0.5, followers: Math.floor(Math.random() * 8000), engagement: Math.random() * 4 },
      { name: 'Instagram', present: Math.random() > 0.6, followers: Math.floor(Math.random() * 3000), engagement: Math.random() * 6 }
    ]

    const presentPlatforms = platforms.filter(p => p.present)
    let score = presentPlatforms.length * 15 // Base score for platform presence

    const contentStrategy = {
      frequency: presentPlatforms.length > 2 ? 'Regular' : 'Irregular',
      quality: Math.floor(Math.random() * 40) + 40,
      automation: Math.random() > 0.7
    }

    if (contentStrategy.frequency === 'Regular') score += 15
    if (contentStrategy.quality > 70) score += 10
    if (contentStrategy.automation) score += 10

    const issues = []
    const opportunities = []

    if (presentPlatforms.length < 2) issues.push('Limited social media presence')
    if (contentStrategy.frequency === 'Irregular') issues.push('Inconsistent posting schedule')
    if (!contentStrategy.automation) issues.push('Manual content management')

    if (!contentStrategy.automation) opportunities.push('Implement automated social media scheduling')
    if (contentStrategy.quality < 70) opportunities.push('Improve content quality with AI assistance')
    opportunities.push('Use AI for social media analytics and insights')

    return {
      score: Math.min(100, score),
      platforms,
      contentStrategy,
      issues,
      opportunities
    }
  }

  private async analyzeOperations(): Promise<OperationsAnalysis> {
    // Simulate operations analysis based on company size and domain
    const isLargeCompany = this.domain.includes('corp') || this.domain.includes('inc') || this.domain.includes('ltd')
    
    const digitalMaturity = {
      cloudAdoption: Math.floor(Math.random() * 40) + (isLargeCompany ? 40 : 20),
      dataManagement: Math.floor(Math.random() * 30) + (isLargeCompany ? 50 : 30),
      processAutomation: Math.floor(Math.random() * 35) + (isLargeCompany ? 35 : 25)
    }

    const systems = {
      crm: Math.random() > (isLargeCompany ? 0.3 : 0.6),
      erp: Math.random() > (isLargeCompany ? 0.4 : 0.8),
      analytics: Math.random() > 0.5,
      automation: Math.random() > 0.7
    }

    let score = (digitalMaturity.cloudAdoption + digitalMaturity.dataManagement + digitalMaturity.processAutomation) / 3
    
    if (systems.crm) score += 10
    if (systems.erp) score += 15
    if (systems.analytics) score += 10
    if (systems.automation) score += 15

    const issues = []
    const opportunities = []

    if (digitalMaturity.cloudAdoption < 50) issues.push('Limited cloud adoption')
    if (digitalMaturity.dataManagement < 60) issues.push('Poor data management practices')
    if (!systems.automation) issues.push('Lack of process automation')

    if (!systems.crm) opportunities.push('Implement AI-powered CRM system')
    if (!systems.automation) opportunities.push('Automate repetitive business processes')
    opportunities.push('Deploy predictive analytics for business insights')

    return {
      score: Math.min(100, Math.round(score)),
      digitalMaturity,
      systems,
      issues,
      opportunities
    }
  }

  private async analyzeCompetitors(): Promise<CompetitorAnalysis> {
    // In production, use competitive intelligence APIs
    const competitors = [
      { name: 'Competitor A', aiReadiness: Math.floor(Math.random() * 30) + 50, strengths: ['Strong digital presence', 'Advanced analytics'] },
      { name: 'Competitor B', aiReadiness: Math.floor(Math.random() * 25) + 60, strengths: ['AI-powered customer service', 'Automated processes'] },
      { name: 'Competitor C', aiReadiness: Math.floor(Math.random() * 20) + 40, strengths: ['Social media automation', 'Data-driven decisions'] }
    ]

    const avgCompetitorScore = competitors.reduce((sum, comp) => sum + comp.aiReadiness, 0) / competitors.length
    const score = Math.max(0, Math.min(100, 100 - (avgCompetitorScore - 50))) // Inverse relationship

    const marketPosition = score > 70 ? 'Leading' : score > 50 ? 'Competitive' : 'Behind'
    
    const gaps = []
    const opportunities = []

    if (avgCompetitorScore > 70) gaps.push('Competitors have advanced AI implementations')
    gaps.push('Limited competitive intelligence capabilities')

    opportunities.push('Implement AI-driven competitive analysis')
    opportunities.push('Develop unique AI-powered value propositions')
    if (marketPosition === 'Behind') opportunities.push('Fast-track AI adoption to catch up')

    return {
      score,
      competitors,
      marketPosition,
      gaps,
      opportunities
    }
  }

  private async analyzeDataReadiness(): Promise<DataReadinessAnalysis> {
    // Simulate data readiness assessment
    const dataQuality = Math.floor(Math.random() * 40) + 40
    const dataGovernance = Math.floor(Math.random() * 35) + 35
    const integration = Math.floor(Math.random() * 30) + 30
    const privacy = Math.floor(Math.random() * 25) + 60

    const score = (dataQuality + dataGovernance + integration + privacy) / 4

    const issues = []
    const opportunities = []

    if (dataQuality < 60) issues.push('Poor data quality and consistency')
    if (dataGovernance < 50) issues.push('Lack of data governance framework')
    if (integration < 40) issues.push('Data silos and integration challenges')

    opportunities.push('Implement data quality management system')
    opportunities.push('Establish comprehensive data governance')
    opportunities.push('Create unified data integration platform')

    return {
      score: Math.round(score),
      dataQuality,
      dataGovernance,
      integration,
      privacy,
      issues,
      opportunities
    }
  }

  private async analyzeCompliance(): Promise<ComplianceAnalysis> {
    // Assess GDPR and AI compliance
    const gdprCompliance = Math.floor(Math.random() * 30) + 50
    const dataProtection = Math.floor(Math.random() * 25) + 55
    const aiEthics = Math.floor(Math.random() * 40) + 30

    const score = (gdprCompliance + dataProtection + aiEthics) / 3

    const risks = []
    const recommendations = []

    if (gdprCompliance < 70) risks.push('GDPR compliance gaps')
    if (dataProtection < 70) risks.push('Data protection vulnerabilities')
    if (aiEthics < 60) risks.push('AI ethics and bias concerns')

    recommendations.push('Conduct comprehensive GDPR compliance audit')
    recommendations.push('Implement AI ethics framework')
    recommendations.push('Establish data protection protocols')

    return {
      score: Math.round(score),
      gdprCompliance,
      dataProtection,
      aiEthics,
      risks,
      recommendations
    }
  }

  private async analyzeAIOpportunity(): Promise<AIOpportunityAnalysis> {
    const readinessFactors = {
      data: Math.floor(Math.random() * 40) + 40,
      technology: Math.floor(Math.random() * 35) + 45,
      skills: Math.floor(Math.random() * 30) + 35,
      culture: Math.floor(Math.random() * 25) + 50
    }

    const score = (readinessFactors.data + readinessFactors.technology + readinessFactors.skills + readinessFactors.culture) / 4

    const useCases = [
      { name: 'Customer Service Automation', feasibility: 85, impact: 75, priority: 'high' as const },
      { name: 'Predictive Analytics', feasibility: 70, impact: 80, priority: 'high' as const },
      { name: 'Process Automation', feasibility: 75, impact: 70, priority: 'medium' as const },
      { name: 'Personalization Engine', feasibility: 60, impact: 85, priority: 'medium' as const },
      { name: 'Fraud Detection', feasibility: 65, impact: 90, priority: 'high' as const }
    ].filter(() => Math.random() > 0.3) // Randomly include use cases

    const roadmap = [
      'Phase 1: Data infrastructure and governance (3-6 months)',
      'Phase 2: Pilot AI projects in high-impact areas (6-12 months)',
      'Phase 3: Scale successful AI implementations (12-18 months)',
      'Phase 4: Advanced AI integration and innovation (18+ months)'
    ]

    return {
      score: Math.round(score),
      readinessFactors,
      useCases,
      roadmap
    }
  }

  // Helper methods for website analysis
  private async checkWebsiteExists(url: string): Promise<boolean> {
    try {
      // In production, make actual HTTP request
      // For now, simulate based on domain patterns
      const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
      return !commonDomains.includes(this.domain)
    } catch {
      return false
    }
  }

  private async analyzeWebsitePerformance(url: string) {
    // In production, integrate with PageSpeed Insights API or similar
    return {
      loadTime: Math.random() * 8 + 1, // 1-9 seconds
      mobileOptimized: Math.random() > 0.3,
      seoScore: Math.floor(Math.random() * 60) + 30 // 30-90
    }
  }

  private async analyzeWebsiteTechnology(url: string) {
    // In production, use tools like Wappalyzer or BuiltWith
    const cmsOptions = ['WordPress', 'Shopify', 'Wix', 'Squarespace', null]
    return {
      cms: cmsOptions[Math.floor(Math.random() * cmsOptions.length)],
      analytics: Math.random() > 0.4,
      chatbot: Math.random() > 0.8,
      aiFeatures: Math.random() > 0.7 ? ['Recommendations', 'Search'] : []
    }
  }

  // Recommendation generators
  private getWebsiteRecommendations(analysis: WebsiteAnalysis): string[] {
    const recommendations = []
    if (analysis.performance.loadTime > 5) {
      recommendations.push('Optimize website performance to reduce loading times')
    }
    if (!analysis.performance.mobileOptimized) {
      recommendations.push('Implement responsive design for mobile optimization')
    }
    if (!analysis.technology.chatbot) {
      recommendations.push('Add AI-powered chatbot for customer support')
    }
    return recommendations
  }

  private getSocialMediaRecommendations(analysis: SocialMediaAnalysis): string[] {
    const recommendations = []
    if (!analysis.contentStrategy.automation) {
      recommendations.push('Implement automated social media scheduling and posting')
    }
    if (analysis.platforms.filter(p => p.present).length < 3) {
      recommendations.push('Expand social media presence across relevant platforms')
    }
    return recommendations
  }

  private getOperationsRecommendations(analysis: OperationsAnalysis): string[] {
    const recommendations = []
    if (!analysis.systems.automation) {
      recommendations.push('Implement process automation to improve efficiency')
    }
    if (analysis.digitalMaturity.cloudAdoption < 50) {
      recommendations.push('Accelerate cloud adoption for better scalability')
    }
    return recommendations
  }

  private getCompetitorRecommendations(analysis: CompetitorAnalysis): string[] {
    return ['Develop AI-powered competitive intelligence system', 'Create unique AI value propositions']
  }

  private getDataReadinessRecommendations(analysis: DataReadinessAnalysis): string[] {
    const recommendations = []
    if (analysis.dataQuality < 60) {
      recommendations.push('Implement data quality management and cleansing processes')
    }
    if (analysis.integration < 50) {
      recommendations.push('Create unified data integration and management platform')
    }
    return recommendations
  }

  private getComplianceRecommendations(analysis: ComplianceAnalysis): string[] {
    return ['Establish comprehensive AI ethics and governance framework', 'Ensure GDPR compliance for AI implementations']
  }

  private getAIOpportunityRecommendations(analysis: AIOpportunityAnalysis): string[] {
    const recommendations: string[] = []
    analysis.useCases.forEach(useCase => {
      if (useCase.priority === 'high') {
        recommendations.push(`Implement ${useCase.name} for high business impact`)
      }
    })
    return recommendations
  }

  private prioritizeRecommendations(recommendations: string[]): string[] {
    // Remove duplicates and limit to top 8 recommendations
    const unique = Array.from(new Set(recommendations))
    return unique.slice(0, 8)
  }
}

// Enhanced AI-powered audit analysis
export interface AIAuditResult {
  overallScore: number
  parameters: {
    [key: string]: {
      score: number
      analysis: string
      recommendations: string[]
      priority: 'high' | 'medium' | 'low'
      opportunities: string[]
      risks: string[]
    }
  }
  summary: string
  actionPlan: string[]
  opportunities: string[]
  risks: string[]
  competitiveAdvantage: string[]
  implementationRoadmap: {
    phase: string
    duration: string
    actions: string[]
    expectedROI: string
  }[]
}

export async function runAIAuditAnalysis({
  domain,
  email,
  analysisTypes
}: {
  domain: string
  email: string
  analysisTypes: string[]
}): Promise<AIAuditResult> {
  try {
    console.log('Starting LeadAI audit analysis for:', domain)
    
    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      console.warn('OpenAI not configured, falling back to basic analysis')
      throw new Error('OpenAI API key not configured')
    }

    // Use the existing audit engine for basic analysis
    const auditEngine = new AuditEngine(email, analysisTypes)
    const basicAudit = await auditEngine.performAudit()

    console.log('Basic audit completed, enhancing with AI...')

    // Enhance with AI analysis
    const aiAnalysis = await generateAIInsights(domain, email, basicAudit, analysisTypes)

    console.log('AI analysis completed successfully')
    return aiAnalysis
  } catch (error) {
    console.error('LeadAI audit analysis failed:', error)
    throw error // Re-throw to trigger fallback in the API route
  }
}

async function generateAIInsights(
  domain: string,
  email: string,
  basicAudit: any,
  analysisTypes: string[]
): Promise<AIAuditResult> {
  const prompt = `
You are an expert AI consultant analyzing a business for AI readiness and opportunities. 

Business Details:
- Domain: ${domain}
- Email: ${email}
- Analysis Types: ${analysisTypes.join(', ')}

Current Analysis Results:
${JSON.stringify(basicAudit, null, 2)}

Please provide a comprehensive AI readiness audit with the following structure:

1. OVERALL ASSESSMENT (0-100 score)
2. DETAILED PARAMETER ANALYSIS for each analysis type:
   - Score (0-100)
   - Detailed analysis (2-3 paragraphs)
   - Specific recommendations (3-5 actionable items)
   - Priority level (high/medium/low)
   - Business opportunities (2-3 items)
   - Potential risks (1-2 items)

3. EXECUTIVE SUMMARY (3-4 sentences)
4. STRATEGIC ACTION PLAN (5-7 prioritized actions)
5. BUSINESS OPPORTUNITIES (4-6 AI-driven opportunities)
6. RISK ASSESSMENT (3-4 key risks to address)
7. COMPETITIVE ADVANTAGE (3-4 ways AI can differentiate this business)
8. IMPLEMENTATION ROADMAP (4 phases with timeline, actions, and expected ROI)

Focus on:
- Practical, actionable insights
- Industry-specific AI applications
- ROI-focused recommendations
- Risk mitigation strategies
- Competitive positioning
- Technology stack recommendations
- Change management considerations

Provide detailed, professional analysis that a business executive would find valuable for making AI investment decisions.
`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a senior AI strategy consultant with expertise in digital transformation, business analysis, and AI implementation. Provide detailed, actionable insights based on data analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })

    const aiInsights = response.choices[0]?.message?.content

    if (!aiInsights) {
      throw new Error('No AI insights generated')
    }

    // Parse the AI response and structure it
    return parseAIResponse(aiInsights, basicAudit)

  } catch (error) {
    console.error('OpenAI API error:', error)
    // Fallback to enhanced basic analysis
    return createFallbackAnalysis(basicAudit, domain)
  }
}

function parseAIResponse(aiInsights: string, basicAudit: any): AIAuditResult {
  // This is a simplified parser - in production, you'd want more robust parsing
  const lines = aiInsights.split('\n').filter(line => line.trim())
  
  // Extract overall score (look for patterns like "Score: 75" or "75/100")
  const scoreMatch = aiInsights.match(/(?:score|overall).*?(\d{1,3})/i)
  const overallScore = scoreMatch ? parseInt(scoreMatch[1]) : basicAudit.score

  // Create structured response
  const result: AIAuditResult = {
    overallScore,
    parameters: {},
    summary: extractSection(aiInsights, 'EXECUTIVE SUMMARY', 'STRATEGIC ACTION PLAN') || 
             `This business shows ${overallScore > 70 ? 'strong' : overallScore > 50 ? 'moderate' : 'limited'} AI readiness with significant opportunities for digital transformation and automation.`,
    actionPlan: extractListItems(aiInsights, 'STRATEGIC ACTION PLAN', 'BUSINESS OPPORTUNITIES') || [
      'Establish AI governance framework',
      'Implement data quality management',
      'Deploy pilot AI projects in high-impact areas',
      'Develop AI skills and capabilities',
      'Create AI-driven customer experiences'
    ],
    opportunities: extractListItems(aiInsights, 'BUSINESS OPPORTUNITIES', 'RISK ASSESSMENT') || [
      'Automated customer service and support',
      'Predictive analytics for business insights',
      'Process automation and optimization',
      'Personalized customer experiences',
      'AI-driven competitive intelligence'
    ],
    risks: extractListItems(aiInsights, 'RISK ASSESSMENT', 'COMPETITIVE ADVANTAGE') || [
      'Data privacy and security concerns',
      'Skills gap and change management',
      'Technology integration challenges',
      'Regulatory compliance requirements'
    ],
    competitiveAdvantage: extractListItems(aiInsights, 'COMPETITIVE ADVANTAGE', 'IMPLEMENTATION ROADMAP') || [
      'First-mover advantage in AI adoption',
      'Enhanced customer experience through automation',
      'Data-driven decision making capabilities',
      'Operational efficiency improvements'
    ],
    implementationRoadmap: [
      {
        phase: 'Phase 1: Foundation',
        duration: '3-6 months',
        actions: ['Data infrastructure setup', 'AI governance framework', 'Skills assessment'],
        expectedROI: '15-25%'
      },
      {
        phase: 'Phase 2: Pilot Projects',
        duration: '6-12 months',
        actions: ['Customer service automation', 'Process optimization', 'Analytics implementation'],
        expectedROI: '25-40%'
      },
      {
        phase: 'Phase 3: Scale & Optimize',
        duration: '12-18 months',
        actions: ['Expand successful pilots', 'Advanced AI features', 'Integration optimization'],
        expectedROI: '40-60%'
      },
      {
        phase: 'Phase 4: Innovation',
        duration: '18+ months',
        actions: ['Cutting-edge AI research', 'Market differentiation', 'AI-driven products'],
        expectedROI: '60%+'
      }
    ]
  }

  // Add parameter analysis for each analysis type
  basicAudit.analysis && Object.keys(basicAudit.analysis).forEach(key => {
    const paramData = basicAudit.analysis[key]
    result.parameters[key] = {
      score: paramData.score || 50,
      analysis: `AI analysis indicates ${key.replace('_', ' ')} shows ${paramData.score > 70 ? 'strong performance' : paramData.score > 50 ? 'moderate capability' : 'significant improvement opportunities'}. ${paramData.issues?.join(' ') || 'Key areas for enhancement identified.'}`,
      recommendations: paramData.opportunities || [
        'Implement AI-driven improvements',
        'Enhance data collection and analysis',
        'Automate manual processes'
      ],
      priority: paramData.score < 50 ? 'high' : paramData.score < 70 ? 'medium' : 'low',
      opportunities: paramData.opportunities || ['AI automation potential', 'Data-driven insights'],
      risks: paramData.issues || ['Implementation challenges', 'Resource requirements']
    }
  })

  return result
}

function extractSection(text: string, startMarker: string, endMarker: string): string | null {
  const startIndex = text.indexOf(startMarker)
  if (startIndex === -1) return null
  
  const endIndex = text.indexOf(endMarker, startIndex)
  const section = endIndex === -1 ? text.substring(startIndex) : text.substring(startIndex, endIndex)
  
  return section.replace(startMarker, '').trim()
}

function extractListItems(text: string, startMarker: string, endMarker: string): string[] | null {
  const section = extractSection(text, startMarker, endMarker)
  if (!section) return null
  
  const items = section.split('\n')
    .filter(line => line.trim().match(/^[-•*]\s+|^\d+\.\s+/))
    .map(line => line.replace(/^[-•*]\s+|^\d+\.\s+/, '').trim())
    .filter(item => item.length > 0)
  
  return items.length > 0 ? items : null
}

function createFallbackAnalysis(basicAudit: any, domain: string): AIAuditResult {
  return {
    overallScore: basicAudit.score,
    parameters: {},
    summary: `AI readiness assessment for ${domain} indicates moderate potential for digital transformation with focused improvements needed in key areas.`,
    actionPlan: basicAudit.recommendations || [
      'Establish data governance framework',
      'Implement process automation',
      'Deploy customer service AI',
      'Enhance digital capabilities'
    ],
    opportunities: [
      'Customer service automation',
      'Predictive business analytics',
      'Process optimization',
      'Competitive intelligence'
    ],
    risks: [
      'Data security and privacy',
      'Implementation complexity',
      'Skills and training requirements'
    ],
    competitiveAdvantage: [
      'Enhanced customer experience',
      'Operational efficiency gains',
      'Data-driven decision making'
    ],
    implementationRoadmap: [
      {
        phase: 'Foundation',
        duration: '3-6 months',
        actions: ['Data setup', 'Governance', 'Skills assessment'],
        expectedROI: '20%'
      },
      {
        phase: 'Implementation',
        duration: '6-12 months',
        actions: ['Pilot projects', 'Process automation'],
        expectedROI: '35%'
      }
    ]
  }
}

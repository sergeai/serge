import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface AuditRequest {
  businessEmail: string
  domain?: string
  analysisTypes: string[]
}

export interface AuditResult {
  domain: string
  overallScore: number
  parameters: {
    websiteSeo: {
      score: number
      insights: string[]
      recommendations: string[]
    }
    socialPresence: {
      score: number
      insights: string[]
      recommendations: string[]
    }
    businessOperations: {
      score: number
      insights: string[]
      recommendations: string[]
    }
    competitorIntelligence: {
      score: number
      insights: string[]
      recommendations: string[]
    }
    dataReadiness: {
      score: number
      insights: string[]
      recommendations: string[]
    }
    compliance: {
      score: number
      insights: string[]
      recommendations: string[]
    }
    marketPosition: {
      score: number
      insights: string[]
      recommendations: string[]
    }
  }
  executiveSummary: string
  nextSteps: string[]
}

export async function generateAuditAnalysis(request: AuditRequest): Promise<AuditResult> {
  const domain = request.domain || extractDomainFromEmail(request.businessEmail)
  
  const prompt = `
    Conduct a comprehensive AI readiness audit for the business domain: ${domain}
    Business email: ${request.businessEmail}
    
    Analyze the following 7 core parameters and provide scores (0-100), insights, and actionable recommendations:
    
    1. Website & SEO - Evaluate tech stack, trust signals, content clarity, and search performance
    2. Social & Digital Presence - Analyze brand voice, content quality, posting cadence, and engagement
    3. Business Operations - Map service flow and internal processes for automation opportunities
    4. Competitor Intelligence - Benchmark against market leaders and identify gaps
    5. Data Readiness - Review CRM usage, analytics, and tracking capabilities
    6. Compliance & Risk - Check privacy policies, GDPR compliance, and legal safeguards
    7. Market Position & Product Pathways - Forecast strategic moves and AI tool recommendations
    
    Provide a detailed analysis in JSON format with:
    - Overall readiness score (0-100)
    - Individual parameter scores with insights and recommendations
    - Executive summary highlighting key findings
    - Next steps for immediate, mid-term, and long-term implementation
    
    Focus on actionable insights that can help consultants pitch specific solutions and automation strategies.
  `

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert AI business consultant specializing in digital transformation and automation readiness assessments. Provide detailed, actionable insights that help consultants identify specific opportunities and solutions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    })

    const analysisText = completion.choices[0].message.content
    if (!analysisText) {
      throw new Error('No analysis generated')
    }

    // Parse the JSON response
    const analysis = JSON.parse(analysisText)
    
    // Structure the response according to our interface
    const auditResult: AuditResult = {
      domain,
      overallScore: analysis.overallScore || 0,
      parameters: {
        websiteSeo: analysis.parameters?.websiteSeo || { score: 0, insights: [], recommendations: [] },
        socialPresence: analysis.parameters?.socialPresence || { score: 0, insights: [], recommendations: [] },
        businessOperations: analysis.parameters?.businessOperations || { score: 0, insights: [], recommendations: [] },
        competitorIntelligence: analysis.parameters?.competitorIntelligence || { score: 0, insights: [], recommendations: [] },
        dataReadiness: analysis.parameters?.dataReadiness || { score: 0, insights: [], recommendations: [] },
        compliance: analysis.parameters?.compliance || { score: 0, insights: [], recommendations: [] },
        marketPosition: analysis.parameters?.marketPosition || { score: 0, insights: [], recommendations: [] },
      },
      executiveSummary: analysis.executiveSummary || 'Analysis completed successfully.',
      nextSteps: analysis.nextSteps || []
    }

    return auditResult
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate audit analysis')
  }
}

function extractDomainFromEmail(email: string): string {
  const domain = email.split('@')[1]
  return domain || 'unknown-domain.com'
}

export async function generateAuditReport(auditResult: AuditResult): Promise<string> {
  const prompt = `
    Generate a professional, branded audit report based on the following analysis:
    
    Domain: ${auditResult.domain}
    Overall Score: ${auditResult.overallScore}/100
    
    Parameter Scores:
    - Website & SEO: ${auditResult.parameters.websiteSeo.score}/100
    - Social & Digital Presence: ${auditResult.parameters.socialPresence.score}/100
    - Business Operations: ${auditResult.parameters.businessOperations.score}/100
    - Competitor Intelligence: ${auditResult.parameters.competitorIntelligence.score}/100
    - Data Readiness: ${auditResult.parameters.dataReadiness.score}/100
    - Compliance & Risk: ${auditResult.parameters.compliance.score}/100
    - Market Position: ${auditResult.parameters.marketPosition.score}/100
    
    Executive Summary: ${auditResult.executiveSummary}
    
    Create a comprehensive, professional report that:
    1. Presents findings in a clear, executive-friendly format
    2. Highlights key opportunities for AI automation
    3. Provides specific recommendations for each parameter
    4. Includes a roadmap for implementation
    5. Positions the findings as sales opportunities for consultants
    
    Format as HTML with professional styling.
  `

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert business report writer. Create professional, visually appealing HTML reports that help consultants present findings to potential clients."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    })

    return completion.choices[0].message.content || 'Report generation failed'
  } catch (error) {
    console.error('Report generation error:', error)
    throw new Error('Failed to generate audit report')
  }
}

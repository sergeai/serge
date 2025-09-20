import { AIAuditResult } from './audit-engine'

export async function generateDetailedAuditReport(auditResult: AIAuditResult): Promise<string> {
  const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Readiness Audit Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .score-card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        
        .score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
            color: white;
        }
        
        .score-excellent { background: linear-gradient(135deg, #10b981, #059669); }
        .score-good { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .score-fair { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .score-poor { background: linear-gradient(135deg, #ef4444, #dc2626); }
        
        .section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
        }
        
        .section h2 {
            color: #1f2937;
            font-size: 1.8rem;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }
        
        .section h3 {
            color: #374151;
            font-size: 1.3rem;
            margin: 20px 0 10px 0;
        }
        
        .parameter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .parameter-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .parameter-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .parameter-score {
            background: #667eea;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;
        }
        
        .priority-high { background: #ef4444; }
        .priority-medium { background: #f59e0b; }
        .priority-low { background: #10b981; }
        
        .list-item {
            background: #f1f5f9;
            padding: 12px 16px;
            margin: 8px 0;
            border-radius: 6px;
            border-left: 3px solid #667eea;
        }
        
        .opportunities .list-item { border-left-color: #10b981; }
        .risks .list-item { border-left-color: #ef4444; }
        .recommendations .list-item { border-left-color: #3b82f6; }
        
        .roadmap-phase {
            background: #f8fafc;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .phase-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .phase-title {
            font-weight: bold;
            color: #1f2937;
        }
        
        .phase-duration {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.9rem;
        }
        
        .roi-badge {
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.9rem;
            margin-left: 10px;
        }
        
        .summary-text {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #4b5563;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        @media print {
            body { background: white; }
            .container { max-width: none; padding: 0; }
            .section { box-shadow: none; border: 1px solid #e5e7eb; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AI Readiness Audit Report</h1>
            <p>Comprehensive Analysis & Strategic Recommendations</p>
            <p style="margin-top: 10px; font-size: 1rem;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="score-card">
            <div class="score-circle ${getScoreClass(auditResult.overallScore)}">
                ${auditResult.overallScore}/100
            </div>
            <h2>Overall AI Readiness Score</h2>
            <p style="font-size: 1.1rem; color: #6b7280; margin-top: 10px;">
                ${getScoreDescription(auditResult.overallScore)}
            </p>
        </div>

        <div class="section">
            <h2>Executive Summary</h2>
            <div class="summary-text">
                ${auditResult.summary}
            </div>
        </div>

        <div class="section">
            <h2>Detailed Parameter Analysis</h2>
            <div class="parameter-grid">
                ${Object.entries(auditResult.parameters).map(([key, param]) => `
                    <div class="parameter-card">
                        <div class="parameter-header">
                            <h3>${formatParameterName(key)}</h3>
                            <div>
                                <span class="parameter-score">${param.score}/100</span>
                                <span class="parameter-score priority-${param.priority}" style="margin-left: 8px;">
                                    ${param.priority.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <p style="margin-bottom: 15px; color: #4b5563;">${param.analysis}</p>
                        
                        <div class="recommendations">
                            <h4 style="margin-bottom: 8px; color: #1f2937;">Recommendations:</h4>
                            ${param.recommendations.map(rec => `<div class="list-item">${rec}</div>`).join('')}
                        </div>
                        
                        <div class="opportunities" style="margin-top: 15px;">
                            <h4 style="margin-bottom: 8px; color: #1f2937;">Opportunities:</h4>
                            ${param.opportunities.map(opp => `<div class="list-item">${opp}</div>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>Strategic Action Plan</h2>
            <div style="margin-top: 20px;">
                ${auditResult.actionPlan.map((action, index) => `
                    <div class="list-item">
                        <strong>${index + 1}.</strong> ${action}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>Business Opportunities</h2>
            <div class="opportunities" style="margin-top: 20px;">
                ${auditResult.opportunities.map(opp => `
                    <div class="list-item">${opp}</div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>Risk Assessment</h2>
            <div class="risks" style="margin-top: 20px;">
                ${auditResult.risks.map(risk => `
                    <div class="list-item">${risk}</div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>Competitive Advantage</h2>
            <div style="margin-top: 20px;">
                ${auditResult.competitiveAdvantage.map(advantage => `
                    <div class="list-item">${advantage}</div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>Implementation Roadmap</h2>
            <div style="margin-top: 20px;">
                ${auditResult.implementationRoadmap.map(phase => `
                    <div class="roadmap-phase">
                        <div class="phase-header">
                            <span class="phase-title">${phase.phase}</span>
                            <div>
                                <span class="phase-duration">${phase.duration}</span>
                                <span class="roi-badge">ROI: ${phase.expectedROI}</span>
                            </div>
                        </div>
                        <div style="margin-top: 10px;">
                            ${phase.actions.map(action => `
                                <div class="list-item" style="margin: 5px 0;">${action}</div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section" style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <h2 style="color: white; border-bottom: 3px solid rgba(255,255,255,0.3);">Ready to Transform Your Business?</h2>
            <p style="font-size: 1.1rem; margin: 20px 0;">
                This comprehensive AI readiness audit provides the roadmap for your digital transformation journey.
            </p>
            <p style="font-size: 0.9rem; opacity: 0.9;">
                Report generated by LeadAI Platform • ${new Date().getFullYear()}
            </p>
        </div>
    </div>
</body>
</html>
  `

  return reportHtml
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'score-excellent'
  if (score >= 65) return 'score-good'
  if (score >= 45) return 'score-fair'
  return 'score-poor'
}

function getScoreDescription(score: number): string {
  if (score >= 80) return 'Excellent AI readiness with strong foundation for advanced implementations'
  if (score >= 65) return 'Good AI readiness with solid potential for strategic AI adoption'
  if (score >= 45) return 'Fair AI readiness with moderate preparation needed for AI initiatives'
  return 'Limited AI readiness requiring significant foundational work before AI implementation'
}

function formatParameterName(key: string): string {
  return key.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('auditId')
    const userId = searchParams.get('userId')

    if (!auditId || !userId) {
      return NextResponse.json(
        { error: 'Missing auditId or userId' },
        { status: 400 }
      )
    }

    // Verify user owns this audit
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .eq('user_id', userId)
      .single()

    if (auditError || !audit) {
      return NextResponse.json(
        { error: 'Audit not found or access denied' },
        { status: 404 }
      )
    }

    if (!audit.report_html) {
      return NextResponse.json(
        { error: 'Report not available' },
        { status: 400 }
      )
    }

    console.log('Audit found:', {
      id: audit.id,
      email: audit.business_email,
      htmlLength: audit.report_html?.length || 0,
      htmlPreview: audit.report_html?.substring(0, 200) || 'No HTML'
    })

    // Validate HTML content
    if (!audit.report_html || audit.report_html.length < 100) {
      console.error('HTML content is too short or empty:', audit.report_html?.length)
      return NextResponse.json(
        { error: 'Report HTML content is invalid or empty' },
        { status: 400 }
      )
    }

    // Generate PDF from HTML
    console.log('About to generate PDF...')
    const pdfBuffer = await generatePDF(audit.report_html, audit.business_email)
    console.log('PDF generation completed, buffer size:', pdfBuffer.length)

    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('Generated PDF buffer is empty')
      return NextResponse.json(
        { error: 'Generated PDF is empty' },
        { status: 500 }
      )
    }

    // Create filename
    const filename = `LeadAI-Audit-Report-${audit.business_email.split('@')[1]}-${new Date().toISOString().split('T')[0]}.pdf`
    
    console.log('Creating response with filename:', filename)
    console.log('PDF buffer details before response:', {
      length: pdfBuffer.length,
      type: typeof pdfBuffer,
      isBuffer: Buffer.isBuffer(pdfBuffer),
      firstBytes: pdfBuffer.slice(0, 10).toString('hex')
    })
    
    // Alternative approach: Return base64 encoded PDF in JSON
    // This bypasses any binary transmission issues
    const base64Pdf = pdfBuffer.toString('base64')
    console.log('Base64 PDF created, length:', base64Pdf.length)
    
    return NextResponse.json({
      success: true,
      filename: filename,
      pdf: base64Pdf,
      size: pdfBuffer.length
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

async function generatePDF(htmlContent: string, businessEmail: string): Promise<Buffer> {
  let browser
  
  try {
    console.log('Starting PDF generation...')
    console.log('HTML content length:', htmlContent.length)
    console.log('HTML preview:', htmlContent.substring(0, 500))
    
    // Validate HTML structure
    if (!htmlContent.includes('<html') && !htmlContent.includes('<body')) {
      console.log('HTML appears to be fragment, wrapping in basic structure')
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>LeadAI Audit Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #667eea; 
              padding-bottom: 20px; 
            }
            .section { 
              margin: 20px 0; 
              padding: 15px; 
              background: #f8f9fa; 
              border-radius: 5px; 
            }
            .score { 
              font-size: 2rem; 
              font-weight: bold; 
              color: #667eea; 
              text-align: center; 
              margin: 20px 0; 
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `
    }
    
    // Launch browser in headless mode
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    })

    console.log('Browser launched successfully')

    const page = await browser.newPage()
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 })
    
    // Set content and wait for fonts/images to load
    try {
      await page.setContent(htmlContent, { 
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 30000 // 30 second timeout
      })
      console.log('HTML content set successfully with network idle')
    } catch (contentError) {
      console.error('Error setting HTML content with networkidle0:', contentError)
      try {
        // Try with simpler wait condition
        await page.setContent(htmlContent, { 
          waitUntil: ['domcontentloaded'],
          timeout: 15000
        })
        console.log('HTML content set with domcontentloaded fallback')
      } catch (fallbackError) {
        console.error('Error with fallback method:', fallbackError)
        // Last resort - just set content without waiting
        await page.setContent(htmlContent)
        console.log('HTML content set with no wait conditions')
      }
    }

    // Wait a bit for any remaining rendering
    await page.waitForTimeout(2000)
    console.log('Waited for additional rendering time')

    // Generate PDF with professional settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: false, // Disable header/footer to avoid issues
      preferCSSPageSize: true,
      timeout: 30000 // Add timeout for PDF generation
    })

    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    
    // Ensure we have a proper Buffer
    const finalBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer)
    console.log('Final buffer size:', finalBuffer.length, 'bytes')
    console.log('Buffer type:', typeof finalBuffer)
    console.log('Is Buffer:', Buffer.isBuffer(finalBuffer))
    
    return finalBuffer

  } catch (error) {
    console.error('Puppeteer PDF generation error:', error)
    throw new Error('Failed to generate PDF with Puppeteer')
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

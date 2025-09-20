import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Redirect webhook requests to the Supabase Edge Function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/activate-subscription`
  
  try {
    // Forward the request to the Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'stripe-signature': request.headers.get('stripe-signature') || '',
      },
      body: await request.text(),
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error forwarding webhook to Edge Function:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

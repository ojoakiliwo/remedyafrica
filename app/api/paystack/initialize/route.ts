import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Mock response - integrate real Paystack later
    return NextResponse.json({ 
      success: true, 
      message: 'Payment initialized (demo mode)',
      data: { reference: 'demo-' + Date.now() }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Payment failed' }, { status: 500 });
  }
}

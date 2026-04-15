import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified (demo mode)',
      tier: body.tier || 'premium'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
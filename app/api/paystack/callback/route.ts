import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) return NextResponse.redirect(new URL('/dashboard', request.url));

  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const verifyData = await verifyRes.json();

    if (verifyData.status && verifyData.data.status === 'success') {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Master Key to bypass RLS
      );

      // AUTOMATED BADGE FLIP
      await supabaseAdmin
        .from('profiles') 
        .update({ is_verified: true }) 
        .eq('email', verifyData.data.customer.email);

      return NextResponse.redirect(new URL('/dashboard?payment=success', request.url));
    }
  } catch (err) {
    console.error("Verification error:", err);
  }

  return NextResponse.redirect(new URL('/dashboard?error=failed', request.url));
}
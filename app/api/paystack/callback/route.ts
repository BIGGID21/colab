import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) return NextResponse.redirect(new URL('/dashboard', request.url));

  try {
    // 1. Verify payment with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const verifyData = await verifyRes.json();

    if (verifyData.status && verifyData.data.status === 'success') {
      // FIX: Await the cookies in Next.js 15
      const cookieStore = await cookies(); 
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: any) {
              cookieStore.set({ name, value: '', ...options });
            },
          },
        }
      );

      // 2. THE BADGE TRIGGER: Update your profiles table
      const userEmail = verifyData.data.customer.email;
      const { error } = await supabase
        .from('profiles') 
        .update({ is_pro: true })
        .eq('email', userEmail);

      if (error) throw error;

      // 3. SUCCESS: Redirect back to dashboard
      return NextResponse.redirect(new URL('/dashboard?payment=success', request.url));
    }
  } catch (err) {
    console.error("Payment Verification Failed:", err);
  }

  return NextResponse.redirect(new URL('/dashboard?error=payment_verification_failed', request.url));
}
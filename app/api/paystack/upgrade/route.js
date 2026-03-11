import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, amount, userId } = await req.json();

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100,
        metadata: { userId },
        // Use window.location.origin in your billing page to send this:
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/paystack/callback`,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, amount, userId, planType } = await req.json();

    const koboAmount = amount * 100;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: koboAmount,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing?success=true`,
        metadata: {
          userId: userId,
          type: 'pro_upgrade', 
          planType: planType,
        },
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Paystack Init Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
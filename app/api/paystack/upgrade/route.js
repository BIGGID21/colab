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
        amount: amount * 100, // Paystack counts in kobo/cents
        metadata: {
          userId: userId, // This "tags" the payment with your Supabase User ID
        },
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing?success=true`,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      console.error("Paystack Init Error:", data.message);
      return new Response(JSON.stringify({ error: data.message }), { status: 400 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

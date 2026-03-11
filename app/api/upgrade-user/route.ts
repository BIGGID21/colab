import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    
    // We use the Service Role Key from your Vercel settings to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! 
    );

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update badge" }, { status: 500 });
  }
}
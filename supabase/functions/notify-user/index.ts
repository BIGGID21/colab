import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // 1. Get the new activity data from the Database Webhook
  const { record } = await req.json()

  // 2. Initialize Supabase with Service Role (to bypass RLS for system tasks)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 3. Fetch the recipient's profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', record.user_id)
    .single()

  if (!profile?.email) {
    return new Response(JSON.stringify({ error: 'Recipient email not found' }), { status: 400 })
  }

  // 4. Send the Email via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CoLab <alerts@yourdomain.com>',
      to: profile.email,
      subject: `Venture Update: ${record.type.toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #111;">New Activity on CoLab</h2>
          <p>Hello <strong>${profile.full_name}</strong>,</p>
          <p>Someone just <strong>${record.message}</strong> on your venture!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
            You are receiving this because you have email alerts enabled for your venture.
          </div>
        </div>
      `,
    }),
  })

  return new Response(JSON.stringify({ success: true }), { 
    headers: { 'Content-Type': 'application/json' } 
  })
})
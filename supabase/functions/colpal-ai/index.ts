import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://deno.land/x/openai@v4.24.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectName } = await req.json()
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    const openai = new OpenAI({ apiKey })

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are ColPal AI, a professional venture architect. Write a 2-3 sentence, high-impact project brief for a new venture. Use a sophisticated, visionary tone."
        },
        {
          role: "user",
          content: `Project Name: ${projectName}. Generate a compelling 'About' section for this venture.`
        }
      ],
      temperature: 0.7,
    })

    const brief = response.choices[0].message.content

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // We use OpenAI's DALL-E 3 as the generation engine here.
    // Ensure you have OPENAI_API_KEY in your .env.local file
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to generate image");
    }

    return NextResponse.json({ url: data.data[0].url });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
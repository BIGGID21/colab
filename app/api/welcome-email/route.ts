import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  // Move the key check and initialization inside the function
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY is missing from environment variables.");
    return NextResponse.json({ error: "Email configuration error" }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    const { email, name } = await request.json();

    const data = await resend.emails.send({
      from: 'CoLab <onboarding@resend.dev>', 
      to: email,
      subject: 'Welcome to CoLab! Action Required 🚀',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, sans-serif; background-color: #f4f4f5; color: #18181b;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                  <tr>
                    <td style="background-color: #000000; padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900;">CoLab</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin-top: 0; font-size: 20px;">Welcome to CoLab, ${name}!</h2>
                      <p style="font-size: 15px; line-height: 24px; color: #3f3f46;">We're excited to have you on board. CoLab connects talented professionals with innovative projects.</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; border-radius: 8px; margin: 20px 0;">
                        <tr>
                          <td style="padding: 24px;">
                            <h3 style="margin-top: 0; font-size: 15px;">Getting Started</h3>
                            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 26px; color: #3f3f46;">
                              <li>Complete your profile to stand out</li>
                              <li>Browse available projects and submit proposals</li>
                              <li>Start building your reputation</li>
                            </ul>
                          </td>
                        </tr>
                      </table>
                      <a href="https://yourcolabdomain.com/dashboard" style="display: inline-block; background-color: #9cf822; color: #000000; text-decoration: none; font-size: 14px; font-weight: 800; padding: 16px 32px; border-radius: 12px;">Go to Dashboard</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
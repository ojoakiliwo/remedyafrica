// lib/email.ts

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function welcomeEmailTemplate(name: string) {
  return {
    subject: 'Welcome to RemedyAfrica - Your Natural Healing Journey Starts Here',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2C3E2D; padding: 24px; text-align: center;">
          <h1 style="color: #97A97C; margin: 0;">RemedyAfrica</h1>
        </div>
        <div style="padding: 32px; background: #fff;">
          <h2 style="color: #2C3E2D;">Welcome, ${name}!</h2>
          <p style="color: #555; line-height: 1.6;">
            Thank you for joining RemedyAfrica. You now have access to Africa's largest database of traditional herbal remedies, verified practitioners, and natural healing resources.
          </p>
          <div style="margin: 24px 0; padding: 16px; background: #F5F5F0; border-radius: 8px;">
            <h3 style="color: #2C3E2D; margin-top: 0;">What's Next?</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>Explore herbal remedies by symptom or category</li>
              <li>Identify plants with our AI-powered tool</li>
              <li>Book consultations with verified practitioners</li>
              <li>Join our community forum</li>
            </ul>
          </div>
          <a href="https://remedyafrica.com/search" style="display: inline-block; background: #97A97C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Start Exploring</a>
        </div>
        <div style="padding: 16px; text-align: center; color: #888; font-size: 12px;">
          <p>RemedyAfrica - Natural Healing, Rooted in Tradition</p>
          <p>If you didn't create this account, please contact us at support@remedyafrica.com</p>
        </div>
      </div>
    `,
    text: `Welcome to RemedyAfrica, ${name}! Thank you for joining. Start exploring herbal remedies at remedyafrica.com/search`,
  };
}

export function practitionerApplicationReceivedTemplate(name: string) {
  return {
    subject: 'Your Practitioner Application Has Been Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2C3E2D; padding: 24px; text-align: center;">
          <h1 style="color: #97A97C; margin: 0;">RemedyAfrica</h1>
        </div>
        <div style="padding: 32px; background: #fff;">
          <h2 style="color: #2C3E2D;">Hello, ${name}</h2>
          <p style="color: #555; line-height: 1.6;">
            We've received your practitioner application. Our team will review your credentials and verify your identity within <strong>5 business days</strong>.
          </p>
          <div style="margin: 24px 0; padding: 16px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
            <p style="color: #92400E; margin: 0;"><strong>What's happening now?</strong></p>
            <ul style="color: #555; line-height: 1.8;">
              <li>Identity verification via your government-issued ID</li>
              <li>Credential and experience review</li>
              <li>Background check</li>
            </ul>
          </div>
          <p style="color: #555;">You'll receive an email once your application is approved.</p>
        </div>
      </div>
    `,
    text: `Hello ${name}, we've received your practitioner application. We'll review within 5 business days.`,
  };
}
import sgMail from '@sendgrid/mail';

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM    = process.env.FROM_EMAIL || 'noreply@travelm8app.vercel.app';
const APP_URL = process.env.APP_URL    || 'https://travelm8app.vercel.app';

if (API_KEY) sgMail.setApiKey(API_KEY);

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!API_KEY) {
    console.log(`[email] To: ${to} | Subject: ${subject}`);
    return;
  }
  await sgMail.send({ to, from: FROM, subject, html });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${APP_URL}/#/verify-email?token=${token}`;
  await send(to, 'Verify your TravelM8 email', `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#F97316">TravelM8</h2>
      <p>Thanks for signing up! Verify your email to secure your account.</p>
      <a href="${link}" style="display:inline-block;background:#F97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
        Verify Email
      </a>
      <p style="color:#888;font-size:13px">Link expires in 24 hours. If you didn't sign up, ignore this.</p>
    </div>
  `);
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${APP_URL}/#/reset-password?token=${token}`;
  await send(to, 'Reset your TravelM8 password', `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#F97316">TravelM8</h2>
      <p>We received a request to reset your password.</p>
      <a href="${link}" style="display:inline-block;background:#F97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
        Reset Password
      </a>
      <p style="color:#888;font-size:13px">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `);
}

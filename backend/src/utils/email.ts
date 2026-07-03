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

export async function sendTripInviteEmail(
  to: string,
  senderName: string,
  trip: { title: string; destination: string; startDate: string; endDate: string; travelers: number; description?: string },
  note?: string
): Promise<void> {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const noteBlock = note
    ? `<blockquote style="border-left:3px solid #F97316;margin:16px 0;padding:10px 16px;color:#555;font-style:italic">${note}</blockquote>`
    : '';
  await send(to, `${senderName} invited you to a trip on TravelM8`, `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111827">
      <div style="background:#F97316;padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <span style="font-size:1.6rem;font-weight:900;color:#fff;letter-spacing:-0.5px">TravelM8</span>
      </div>
      <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:1rem;margin:0 0 8px"><strong>${senderName}</strong> invited you to join a road trip:</p>
        ${noteBlock}
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:20px 0">
          <h2 style="margin:0 0 10px;color:#111827;font-size:1.15rem">${trip.title}</h2>
          <p style="margin:4px 0;color:#6b7280;font-size:0.9rem">📍 ${trip.destination}</p>
          <p style="margin:4px 0;color:#6b7280;font-size:0.9rem">📅 ${fmt(trip.startDate)} – ${fmt(trip.endDate)}</p>
          <p style="margin:4px 0;color:#6b7280;font-size:0.9rem">👥 ${trip.travelers} traveler${trip.travelers !== 1 ? 's' : ''}</p>
          ${trip.description ? `<p style="margin:12px 0 0;color:#374151;font-size:0.9rem">${trip.description}</p>` : ''}
        </div>
        <a href="${APP_URL}" style="display:inline-block;background:#F97316;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.95rem">
          Open TravelM8
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">
          Sign in or create a free account to see the full trip details and vote on stops.
        </p>
      </div>
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

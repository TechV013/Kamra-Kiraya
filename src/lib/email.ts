const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.SMTP_FROM || "noreply@kamarakiraya.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  try {
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject: "Reset your कमरा किराया password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#9f2b33">कमरा किराया</h2>
            <p>You requested a password reset.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#9f2b33;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0">
              Reset Password
            </a>
            <p style="color:#666;font-size:14px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
      return true;
    }

    console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}

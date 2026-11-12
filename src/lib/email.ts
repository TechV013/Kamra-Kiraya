import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const FROM = process.env.SMTP_FROM || "noreply@kamrakiraya.com";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  return transporter;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.error(
      "Email not sent: SMTP_HOST, SMTP_USER and SMTP_PASS must be configured."
    );
    return Promise.resolve(false);
  }

  return mailer
    .sendMail({ from: FROM, to, subject, html })
    .then(() => true)
    .catch((err) => {
      console.error("Email send error:", err);
      return false;
    });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const link = `${appUrl()}/reset-password?token=${token}`;
  return sendMail(
    email,
    "Reset your कमरा किराया password",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#8B1A1A;">Password Reset</h1>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#8B1A1A;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Reset Password</a>
      <p style="color:#666;font-size:14px;">If you didn't request this, ignore this email.</p>
    </div>`
  );
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  return sendMail(
    email,
    "Welcome to कमरा किराया!",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#8B1A1A;">Welcome, ${name}!</h1>
      <p>You've successfully created your कमरा किराया account. Start exploring rooms near your college today.</p>
      <a href="${appUrl()}/browse" style="display:inline-block;padding:12px 24px;background:#8B1A1A;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Browse Rooms</a>
    </div>`
  );
}

export async function sendBookingConfirmationStudent(
  email: string,
  name: string,
  roomTitle: string,
  bookingId: string,
  amount: number
): Promise<boolean> {
  return sendMail(
    email,
    "Booking Confirmed — कमरा किराया",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#8B1A1A;">Booking Confirmed!</h1>
      <p>Hi ${name}, your booking for <strong>${roomTitle}</strong> is confirmed.</p>
      <p>Amount: <strong>₹${amount}</strong></p>
      <a href="${appUrl()}/dashboard/student" style="display:inline-block;padding:12px 24px;background:#8B1A1A;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">View Booking</a>
    </div>`
  );
}

export async function sendBookingNotificationOwner(
  email: string,
  ownerName: string,
  studentName: string,
  roomTitle: string
): Promise<boolean> {
  return sendMail(
    email,
    "New Booking Request — कमरा किराया",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#8B1A1A;">New Booking Request</h1>
      <p>Hi ${ownerName}, <strong>${studentName}</strong> has requested to book <strong>${roomTitle}</strong>.</p>
      <a href="${appUrl()}/dashboard/owner/bookings" style="display:inline-block;padding:12px 24px;background:#8B1A1A;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">View Bookings</a>
    </div>`
  );
}

export async function sendVerificationApproved(
  email: string,
  name: string
): Promise<boolean> {
  return sendMail(
    email,
    "Verification Approved — कमरा किराया",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#8B1A1A;">Verification Approved!</h1>
      <p>Hi ${name}, your documents have been verified. You can now publish rooms on कमरा किराया.</p>
      <a href="${appUrl()}/dashboard/owner/add-room" style="display:inline-block;padding:12px 24px;background:#8B1A1A;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Add Room</a>
    </div>`
  );
}

export async function sendVerificationRejected(
  email: string,
  name: string,
  reason: string
): Promise<boolean> {
  return sendMail(
    email,
    "Verification Update — कमरा किराया",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#8B1A1A;">Verification Update</h1>
      <p>Hi ${name}, your verification was not approved.</p>
      <p style="background:#fef2f2;padding:12px;border-radius:8px;color:#991b1b;"><strong>Reason:</strong> ${reason}</p>
      <p>Please resubmit your documents with the correct information.</p>
      <a href="${appUrl()}/dashboard/owner/verification" style="display:inline-block;padding:12px 24px;background:#8B1A1A;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Resubmit</a>
    </div>`
  );
}

export async function sendComplaintFiled(
  email: string,
  name: string,
  complainantName: string,
  title: string,
  complaintId: string,
  role: "owner" | "student"
): Promise<boolean> {
  const dashboard = role === "owner" ? "/dashboard/owner/complaints" : "/dashboard/student/complaints";
  return sendMail(
    email,
    "Complaint Filed — कमरा किराया",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#8B1A1A;">Complaint Filed</h1>
      <p>Hi ${name}, <strong>${complainantName}</strong> has filed a complaint regarding "<strong>${title}</strong>".</p>
      <a href="${appUrl()}${dashboard}/${complaintId}" style="display:inline-block;padding:12px 24px;background:#8B1A1A;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">View Complaint</a>
    </div>`
  );
}

export async function sendComplaintResolved(
  email: string,
  name: string,
  title: string,
  complaintId: string
): Promise<boolean> {
  return sendMail(
    email,
    "Complaint Resolved — कमरा किराया",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#8B1A1A;">Complaint Resolved</h1>
      <p>Hi ${name}, the complaint regarding "<strong>${title}</strong>" has been resolved.</p>
      <a href="${appUrl()}/dashboard/student/complaints/${complaintId}" style="display:inline-block;padding:12px 24px;background:#8B1A1A;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">View Details</a>
    </div>`
  );
}

export async function sendComplaintEscalated(
  email: string,
  name: string,
  title: string,
  complaintId: string
): Promise<boolean> {
  return sendMail(
    email,
    "Complaint Escalated — कमरा किराया",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="color:#8B1A1A;">Complaint Escalated</h1>
      <p>Hi ${name}, the complaint regarding "<strong>${title}</strong>" has been escalated to admin review.</p>
      <a href="${appUrl()}/dashboard/student/complaints/${complaintId}" style="display:inline-block;padding:12px 24px;background:#8B1A1A;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">View Details</a>
    </div>`
  );
}

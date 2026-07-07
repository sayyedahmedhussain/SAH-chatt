import nodemailer from "nodemailer";

let transporter = null;

// Lazily builds (and caches) the nodemailer transporter from env vars.
// Supports two setups:
//   1) EMAIL_SERVICE=gmail (or any nodemailer "well-known" service) + EMAIL_USER + EMAIL_PASS
//   2) Generic SMTP via EMAIL_HOST + EMAIL_PORT + EMAIL_USER + EMAIL_PASS
const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "⚠️  EMAIL_USER / EMAIL_PASS not set in .env — OTP emails will not be sent. " +
        "See backend/.env.example for setup instructions."
    );
  }

  if (process.env.EMAIL_SERVICE) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g. "gmail"
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true", // true for port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return transporter;
};

export const sendOtpEmail = async (toEmail, username, otp) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #4f46e5;">SAH-Chatt Verification</h2>
      <p>Hi ${username || "there"},</p>
      <p>Use the code below to verify your account. It expires in 10 minutes.</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #eef2ff; color: #4338ca; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  try {
    const tx = getTransporter();
    await tx.sendMail({
      from: `"SAH-Chatt" <${from}>`,
      to: toEmail,
      subject: "Your SAH-Chatt verification code",
      html,
      text: `Your SAH-Chatt verification code is ${otp}. It expires in 10 minutes.`,
    });
    return true;
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error.message);
    // Don't crash the request flow — surface it to the caller so the
    // controller can decide how to respond (e.g. still allow resend).
    throw error;
  }
};

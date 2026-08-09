import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
// 465 = implicit SSL (secure:true). 587 = usually STARTTLS; set SMTP_SECURE=true
// if your host only offers SSL (e.g. wrong-version-number SSL errors on 587).
const secure = process.env.SMTP_SECURE === "true";
const requireTLS = secure ? false : process.env.SMTP_REQUIRE_TLS !== "false";
const ignoreTLS = process.env.SMTP_IGNORE_TLS === "true";
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || user;
const name = process.env.EMAIL_NAME || "Kenya Math Quest";

// Email is fully configured via environment variables; skips sending otherwise.
const configured = Boolean(host && user && pass);

const transporter = configured
  ? nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      ...(ignoreTLS ? { ignoreTLS: true } : { requireTLS }),
    })
  : null;

export const sendCertificateEmail = async (to, password) => {
  if (!transporter) {
    console.warn("⚠ Email not configured (SMTP_HOST/EMAIL_USER/EMAIL_PASS missing) — skipping certificate email");
    return;
  }
  await transporter.sendMail({
    from: `"${name}" <${from}>`,
    to,
    subject: "Kenya Math Quest Certificate",
    text: `Dear student,\n\nYour certificate is ready. Use this password to download it:\n\n  ${password}\n\nThank you,\n${name}`,
  });
};

export const sendLinkingCodeEmail = async (to, code, childName) => {
  if (!transporter) {
    console.warn("⚠ Email not configured — linking confirmation email skipped");
    return;
  }
  await transporter.sendMail({
    from: `"${name}" <${from}>`,
    to,
    subject: "Kenya Math Quest — Confirm Parent Link",
    text: `Dear ${childName || "Student"},\n\nA parent is trying to link your account to theirs.\n\nTo approve the link, share this 6-digit code with them:\n\n  ${code}\n\nIt expires in 30 minutes. If you did not ask for this, ignore this email.\n\nThank you,\n${name}`,
  });
};

export const sendPasswordResetEmail = async (to, code, recipientName, role) => {
  if (!transporter) {
    console.warn(`⚠ Email not configured — password reset email for ${to} was skipped`);
    return;
  }
  await transporter.sendMail({
    from: `"${name}" <${from}>`,
    to,
    subject: "Kenya Math Quest — Password Reset Code",
    text: `Dear ${recipientName || "User"},\n\nYou requested to reset your ${role === "school" ? "school" : ""} account password.\n\nYour reset code is:\n\n  ${code}\n\nIt expires in 15 minutes. If you did not request this, ignore this email.\n\nThank you,\n${name}`,
  });
};

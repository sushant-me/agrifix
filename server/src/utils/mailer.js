import nodemailer from 'nodemailer';
import { env, isDev } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_PORT === 465,
    auth: env.MAIL_USERNAME ? { user: env.MAIL_USERNAME, pass: env.MAIL_PASSWORD } : undefined,
  });
  return transporter;
}

/**
 * Send an email. In development without SMTP config the message is
 * logged to the console instead of failing.
 */
export async function sendMail({ to, subject, text, html }) {
  if (!env.MAIL_HOST || !env.MAIL_USERNAME) {
    if (isDev()) {
      console.log(`[mail:dev] to=${to} subject="${subject}" body=${text}`);
      return { devLogOnly: true };
    }
    return { skipped: true };
  }
  try {
    await getTransporter().sendMail({
      from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('[mail] send failed:', err.message);
    return { failed: true };
  }
}

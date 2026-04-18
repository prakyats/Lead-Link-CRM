const nodemailer = require('nodemailer');

function getRequiredEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function createTransporter() {
  const host = getRequiredEnv('SMTP_HOST');
  const port = parseInt(getRequiredEnv('SMTP_PORT'), 10);
  const user = getRequiredEnv('SMTP_USER');
  const pass = getRequiredEnv('SMTP_PASS');

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

async function sendEmail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || `LeadLink CRM <${process.env.SMTP_USER}>`;
  const transporter = createTransporter();

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
}

module.exports = { sendEmail };


const nodemailer = require("nodemailer");
function buildTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return null;
}
async function sendMail(to, subject, text) {
  const transporter = buildTransporter();
  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@lostfinder.local",
      to,
      subject,
      text,
    });
  } else {
    console.log("[EmailSimulated]", { to, subject });
  }
}
module.exports = sendMail;

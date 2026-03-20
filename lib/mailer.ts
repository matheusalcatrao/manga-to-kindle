import nodemailer from "nodemailer";

/**
 * Creates a reusable Nodemailer transporter from environment variables.
 * Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    // Set to true only when using port 465 (SSL)
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends a PDF buffer as an email attachment to the user's Kindle address.
 *
 * @param to       - Recipient address, must end with @kindle.com
 * @param pdfBuffer - Raw PDF bytes
 * @param filename  - Attachment filename shown on the Kindle (e.g. "One-Piece-Ch-1.pdf")
 */
export async function sendPdfToKindle(
  to: string,
  pdfBuffer: Buffer,
  filename: string,
): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"MangaToKindle" <${process.env.SMTP_FROM}>`,
    to,
    // Kindle uses the subject as the document title — keep it clean
    subject: filename.replace(/\.pdf$/i, "").replace(/-/g, " "),
    text: "Your manga chapter has been converted and is attached as a Kindle-ready PDF.",
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

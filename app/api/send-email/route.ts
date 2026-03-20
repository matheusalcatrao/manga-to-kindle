import { NextRequest, NextResponse } from "next/server";
import { sendPdfToKindle } from "@/lib/mailer";

const PYTHON_API_URL = process.env.PYTHON_API_URL ?? "http://localhost:8000";

interface SendEmailBody {
  kindleEmail: string;
  /** Relative path returned by Python, e.g. "/download/manga_abc.pdf" */
  pdfUrl: string;
  filename: string;
}

/**
 * POST /api/send-email
 *
 * 1. Fetches the generated PDF from the Python service using `pdfUrl`.
 * 2. Sends it as an attachment to the user's Kindle email via Nodemailer.
 *
 * Expected body: { kindleEmail, pdfUrl, filename }
 */
export async function POST(req: NextRequest) {
  // ── 1. Parse body ─────────────────────────────────────────────────────────
  let body: SendEmailBody;
  try {
    body = (await req.json()) as SendEmailBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { kindleEmail, pdfUrl, filename } = body;

  if (!kindleEmail || !pdfUrl || !filename) {
    return NextResponse.json(
      { error: "Missing required fields: kindleEmail, pdfUrl, filename." },
      { status: 400 },
    );
  }

  // ── 2. Download the PDF from the Python service ───────────────────────────
  let pdfBuffer: Buffer;
  try {
    const pdfRes = await fetch(`${PYTHON_API_URL}${pdfUrl}`, {
      signal: AbortSignal.timeout(30_000),
    });

    if (!pdfRes.ok) {
      return NextResponse.json(
        { error: "Failed to retrieve the PDF from the processing service." },
        { status: 502 },
      );
    }

    pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
  } catch (err: unknown) {
    console.error("[send-email] PDF fetch error:", err);
    return NextResponse.json(
      { error: "Could not download the PDF from the processing service." },
      { status: 503 },
    );
  }

  // ── 3. Send PDF to Kindle via Nodemailer ──────────────────────────────────
  try {
    await sendPdfToKindle(kindleEmail, pdfBuffer, filename);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[send-email] Nodemailer error:", err);
    return NextResponse.json(
      {
        error:
          "Failed to send the email. Please check your SMTP configuration.",
      },
      { status: 500 },
    );
  }
}

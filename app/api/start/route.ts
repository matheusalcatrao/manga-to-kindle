import { NextRequest, NextResponse } from "next/server";
import { mangaFormSchema } from "@/lib/validations";

const PYTHON_API_URL =
  process.env.PYTHON_API_URL ?? "http://localhost:5001/api/v1";

/**
 * POST /api/proxy-convert
 *
 * Bridge between the frontend and the Python FastAPI processing service.
 * Validates the request payload with Zod before forwarding to avoid
 * hitting the Python service with malformed data.
 *
 * Expected body: { mangaUrl: string, kindleEmail: string }
 * Returns:       { pdf_url: string, filename: string }
 */
export async function POST(req: NextRequest) {
  // ── 1. Parse & validate the incoming payload ──────────────────────────────
  let body: unknown;
  console.log("[proxy-convert] Received request:", req.url);
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = mangaFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { mangaUrl } = parsed.data;

  // ── 2. Forward to the Python processing service ───────────────────────────
  try {
    const pythonRes = await fetch(`${PYTHON_API_URL}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: mangaUrl }),
      // Manga scraping + PDF generation can be slow — allow up to 2 minutes
      signal: AbortSignal.timeout(120_000),
    });

    if (!pythonRes.ok) {
      const errBody = await pythonRes
        .json()
        .catch(() => ({ detail: "Unknown processing error." }));
      return NextResponse.json(
        {
          error: errBody.detail ?? "The processing service returned an error.",
        },
        { status: pythonRes.status },
      );
    }

    const data = await pythonRes.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof Error) {
      // AbortSignal fires a DOMException with name 'TimeoutError'
      if (err.name === "TimeoutError") {
        return NextResponse.json(
          {
            error:
              "Conversion timed out. The chapter may be too large — please try again.",
          },
          { status: 504 },
        );
      }
      // Node fetch throws TypeError on ECONNREFUSED / network errors
      if (err.name === "TypeError" || err.message.includes("ECONNREFUSED")) {
        return NextResponse.json(
          {
            error:
              "Could not reach the processing service. Make sure the Python backend is running.",
          },
          { status: 503 },
        );
      }
    }

    console.error("[proxy-convert] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "This endpoint only accepts POST requests." },
    { status: 405 },
  );
}

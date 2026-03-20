const PYTHON_API_URL = process.env.PYTHON_API_URL ?? "http://localhost:5001";

/**
 * GET /api/download
 *
 * Proxies the PDF download from the Python processing service so the
 * browser never needs a direct connection to the Python backend.
 *
 * Forwards: GET http://python-service/api/v1/download
 */
export async function GET() {
  let upstream: Response;
  try {
    upstream = await fetch(`${PYTHON_API_URL}/api/v1/download`, {
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return new Response(
      JSON.stringify({
        error:
          "Could not reach the processing service. Make sure the Python backend is running.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: "File not found or download unavailable." }),
      {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const contentDisposition =
    upstream.headers.get("Content-Disposition") ??
    `attachment; filename="chapter.pdf"`;
  const contentType = upstream.headers.get("Content-Type") ?? "application/pdf";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
    },
  });
}

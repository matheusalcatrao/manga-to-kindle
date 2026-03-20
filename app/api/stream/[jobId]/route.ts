import { NextRequest } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL ?? "http://localhost:5001";

/**
 * GET /api/stream/[jobId]
 *
 * Proxies the Server-Sent Events stream from the Python processing service
 * so the browser never needs a direct connection to the Python backend.
 *
 * Forwards: GET http://python-service/api/v1/stream/<jobId>
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  let upstream: Response;
  try {
    upstream = await fetch(`${PYTHON_API_URL}/api/v1/stream/${jobId}`, {
      headers: { Accept: "text/event-stream" },
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
      JSON.stringify({ error: "Job not found or stream unavailable." }),
      {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

import type { JobStreamMessage } from "@/types";

export interface StreamJobResult {
  /** Output PDF filename/path returned by the Python service. */
  pdf: string;
  /** Final job status reported by the Python service. */
  status: string;
}

/**
 * Subscribes to `/api/stream/<jobId>` (Next.js SSE proxy) via Server-Sent Events
 * and returns a Promise that:
 *  - Resolves with `{ pdf, status }` when the server emits a `done` event.
 *  - Rejects with an Error when the connection fails.
 *
 * @param jobId      - Job identifier returned by the Python `/start` endpoint.
 * @param onProgress - Optional callback invoked for every incoming message
 *                     (including intermediate `progress` events).
 */
export function streamJob(
  jobId: string,
  onProgress?: (msg: JobStreamMessage) => void,
): Promise<StreamJobResult> {
  return new Promise((resolve, reject) => {
    const es = new EventSource(`/api/stream/${jobId}`);

    es.onmessage = (event: MessageEvent) => {
      let msg: JobStreamMessage;
      try {
        msg = JSON.parse(event.data as string) as JobStreamMessage;
      } catch {
        console.warn("[streamJob] Could not parse SSE message:", event.data);
        return;
      }

      onProgress?.(msg);

      if (msg.type === "done") {
        es.close();
        resolve({
          pdf: msg.pdf ?? "",
          status: msg.status ?? "done",
        });
      }
    };

    es.onerror = () => {
      es.close();
      reject(new Error("SSE connection to the processing service failed."));
    };
  });
}

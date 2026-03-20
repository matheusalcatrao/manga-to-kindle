/** Lifecycle states of a single conversion+delivery job. */
export type ConversionStatus = "idle" | "converting" | "done" | "error";

/** Shape returned by the Python /convert endpoint and forwarded by the Next.js proxy. */
export interface ConversionResult {
  /** Unique job identifier returned by the Python service, e.g. "abc123" */
  jobId: string;
  /** Relative path to the generated PDF, e.g. "/download/manga_abc123.pdf" */
  pdf_url: string;
  /** Original filename, e.g. "manga_abc123.pdf" */
  filename: string;
}

/** Values collected by the main form. */
export interface MangaFormValues {
  mangaUrl: string;
}

/** Messages streamed over SSE at api/v1/stream/<jobId>. */
export interface JobStreamMessage {
  /** Event type emitted by the Python service. */
  type: "heartbeat" | "log" | "done";
  /** Human-readable log text; present on `log` events. */
  message?: string;
  /** True when the message replaces the previous line (carriage-return progress); present on `log` events. */
  cr?: boolean;
  /** Output PDF filename/path; present on `done` events. */
  pdf?: string;
  /** Job completion status; present on `done` events. */
  status?: string;
}

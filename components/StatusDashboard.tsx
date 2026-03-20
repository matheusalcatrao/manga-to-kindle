import { CheckCircle2, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import type { ConversionStatus } from '@/types';

interface StatusDashboardProps {
  status: Exclude<ConversionStatus, 'idle'>;
  errorMessage?: string;
  /** Live message streamed from SSE (api/stream/<jobId>). */
  progressMessage?: string;
}

interface Step {
  id: 'converting';
  label: string;
  description: string;
  Icon: React.ElementType;
}

const STEPS: Step[] = [
  {
    id: 'converting',
    label: 'Fetching & Converting',
    description: 'Scraping chapter pages and building the PDF…',
    Icon: BookOpen,
  },
];

/** Maps each status to the index of the currently-active step. */
const STATUS_INDEX: Partial<Record<ConversionStatus, number>> = {
  converting: 0,
  done: 1, // past the last step → everything completed
};

export default function StatusDashboard({ status, errorMessage, progressMessage }: StatusDashboardProps) {
  // ── Error state ────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-red-800/60 bg-red-950/30 p-4"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
        <div>
          <p className="text-sm font-semibold text-red-300">Something went wrong</p>
          <p className="mt-1 text-xs leading-relaxed text-red-400/80">
            {errorMessage ?? 'Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  const activeIndex = STATUS_INDEX[status] ?? 0;
  const isDone = status === 'done';

  return (
    <div
      aria-live="polite"
      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm"
    >
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
        Progress
      </p>

      {/* Step list */}
      <ol className="space-y-5">
        {STEPS.map((step, index) => {
          const isCompleted = isDone || activeIndex > index;
          const isActive = !isDone && activeIndex === index;
          const { Icon } = step;

          return (
            <li key={step.id} className="flex items-start gap-3">
              {/* Step indicator */}
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700">
                    <Icon className="h-3 w-3 text-zinc-600" />
                  </span>
                )}
              </div>

              {/* Step text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium leading-none transition-colors ${
                    isCompleted
                      ? 'text-indigo-400'
                      : isActive
                        ? 'text-zinc-100'
                        : 'text-zinc-600'
                  }`}
                >
                  {step.label}
                </p>
                {(isActive || isCompleted) && (
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                    {step.description}
                  </p>
                )}
                {isActive && progressMessage && (
                  <p className="mt-1 text-xs leading-relaxed text-indigo-400/80 italic">
                    {progressMessage}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Success banner */}
      {isDone && (
        <div className="mt-5 flex items-center gap-2.5 rounded-lg border border-indigo-900/50 bg-indigo-950/40 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-400" />
          <p className="text-sm text-indigo-300">
            <span className="font-semibold">Done!</span> Your PDF is downloading.
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Download, RefreshCcw, Link2, AlertCircle } from 'lucide-react';

import { mangaFormSchema, type MangaFormSchema } from '@/lib/validations';
import type { ConversionStatus, ConversionResult, JobStreamMessage } from '@/types';
import { streamJob } from '@/lib/streamJob';
import StatusDashboard from '@/components/StatusDashboard';

export default function MangaForm() {
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [streamMessage, setStreamMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MangaFormSchema>({
    resolver: zodResolver(mangaFormSchema),
  });

  const isLoading = status === 'converting';
  const isDone = status === 'done';

  // ── Orchestration ──────────────────────────────────────────────────────────
  async function onSubmit(values: MangaFormSchema) {
    setStatus('converting');
    setErrorMessage('');
    setStreamMessage('');

    try {
      // ── Step 1: Start the job on the Python service ────────────────────────
      const convertRes = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!convertRes.ok) {
        const err = await convertRes.json().catch(() => ({ error: 'Conversion failed.' }));
        throw new Error(err.error ?? 'Conversion failed.');
      }

      const responseData = (await convertRes.json()) as ConversionResult & { job_id?: string };
      const receivedJobId = responseData.job_id;
      console.log('Received job ID:', receivedJobId);

      if (!receivedJobId) {
        throw new Error('Processing service did not return a job ID.');
      }

      // ── Step 2: Stream progress via SSE (api/stream/<jobId>) ──────────────
      await streamJob(
        receivedJobId,
        (msg: JobStreamMessage) => {
          if (msg.message) setStreamMessage(msg.message);
        },
      );

      // ── Step 3: Download the generated PDF ────────────────────────────────
      triggerDownload();

      setStatus('done');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(message);
      setStatus('error');
    }
  }

  function triggerDownload() {
    const a = document.createElement('a');
    a.href = '/api/download';
    a.click();
  }

  function handleReset() {
    reset();
    setStatus('idle');
    setErrorMessage('');
    setStreamMessage('');
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Chapter URL ─────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label htmlFor="mangaUrl" className="block text-sm font-medium text-zinc-300">
            Chapter URL
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Link2 className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              id="mangaUrl"
              type="url"
              placeholder="https://mangareader.to/chapter/one-piece-3/1"
              autoComplete="off"
              disabled={isLoading || isDone}
              aria-invalid={!!errors.mangaUrl}
              className={inputClass(!!errors.mangaUrl, isLoading || isDone)}
              {...register('mangaUrl')}
            />
          </div>
          <FieldError message={errors.mangaUrl?.message} />
        </div>

        {/* Submit / Reset button ─────────────────────────────────────────────── */}
        {isDone ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={triggerDownload}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-900/40 transition hover:bg-indigo-500 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Download again
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700 active:scale-[0.98]"
            >
              <RefreshCcw className="h-4 w-4" />
              Convert another chapter
            </button>
          </div>
        ) : (
          <button
            type="submit"
            onClick={status === 'error' ? handleReset : undefined}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-900/40 transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Convert & Download
              </>
            )}
          </button>
        )}
      </form>

      {/* Status dashboard — only visible once a job is in progress ─────────── */}
      {status !== 'idle' && (
        <StatusDashboard
          status={status as Exclude<ConversionStatus, 'idle'>}
          errorMessage={errorMessage}
          progressMessage={streamMessage}
        />
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function inputClass(hasError: boolean, disabled: boolean) {
  return [
    'w-full rounded-xl border bg-zinc-800/60 py-3 pl-10 pr-4 text-sm text-zinc-100',
    'placeholder-zinc-600 outline-none transition',
    'focus:ring-2 focus:ring-offset-0',
    hasError
      ? 'border-red-600/70 focus:ring-red-500/40'
      : 'border-zinc-700 hover:border-zinc-600 focus:ring-indigo-500/40 focus:border-indigo-600',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-center gap-1.5 text-xs text-red-400">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

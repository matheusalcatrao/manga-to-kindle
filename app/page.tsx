'use client';

import { BookOpen, Download, Loader2, AlertCircle } from 'lucide-react';
import MangaForm from '@/components/MangaForm';
import { useEffect, useRef } from 'react';

export default function Home() {
  const isLoading = 'loading';
  const status = 'idle';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-16">
      <div className="w-full max-w-md space-y-4">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/50">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              MangaToKindle
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              Paste a chapter URL and get a Kindle&#8209;ready PDF delivered to your device.
            </p>
          </div>
        </header>

        {/* ── Form card ──────────────────────────────────────────────────── */}
        <main className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
          <MangaForm />
        </main>

        {/* ── SSE log panel — visible once a job is running ──────────────── */}
        {status !== 'idle' && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            {/* Panel header */}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
              ) : status === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
              )}
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {isLoading ? 'Processing…' : status === 'done' ? 'Complete' : 'Failed'}
              </p>
            </div>
          </div>
        )}

        {/* ── Footer note ────────────────────────────────────────────────── */}
        <p className="mt-6 text-center text-xs text-zinc-600">
          The PDF is delivered via e-mail to your Kindle device. Make sure to
          allow the sender in your{' '}
          <a
            href="https://www.amazon.com/hz/mycd/myx#/home/settings/payment"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-zinc-400 transition-colors"
          >
            Approved Personal Document E-mail List
          </a>
          .
        </p>
      </div>
    </div>
  );
}

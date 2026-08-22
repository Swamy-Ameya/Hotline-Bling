'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, HeartPulse, Loader2, Search, Sparkles } from 'lucide-react';
import { NeuButton, Surface } from '@/components/neu';
import { SYMPTOM_LABEL, type Symptom } from '@/lib/db/types';
import { cn } from '@/lib/utils';

interface StudentHit {
  id: string;
  registration: string;
  name: string;
  blockId: string | null;
  floor: number | null;
  room: string | null;
}

const SYMPTOMS = Object.keys(SYMPTOM_LABEL) as Symptom[];

const WHEN_OPTIONS = [
  { label: 'In the last few hours', hours: 3 },
  { label: 'Earlier today', hours: 10 },
  { label: 'Yesterday', hours: 26 },
  { label: 'Two or three days ago', hours: 56 },
];

/**
 * Deliberately three short steps rather than one long form.
 *
 * The whole point of this channel is that it catches people who feel rough but
 * would never walk to the health centre. If filling it in takes longer than
 * shrugging and going to bed, nobody uses it and the system has no early input.
 */
export function ReportClient() {
  const [step, setStep] = useState(0);

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<StudentHit[]>([]);
  const [student, setStudent] = useState<StudentHit | null>(null);

  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [whenHours, setWhenHours] = useState<number | null>(null);
  const [severity, setSeverity] = useState(2);

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ prompted: boolean } | null>(null);

  useEffect(() => {
    if (query.trim().length < 2 || student) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/students?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!cancelled) setHits(json.results ?? []);
    }, 160);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, student]);

  function toggle(s: Symptom) {
    setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  async function submit() {
    if (!student || whenHours === null) return;
    setSaving(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: student.registration,
          symptoms,
          onsetAt: new Date(Date.now() - whenHours * 3600_000).toISOString(),
          severity,
        }),
      });
      const json = await res.json();
      if (json.ok) setDone({ prompted: Boolean(json.prompted) });
    } finally {
      setSaving(false);
    }
  }

  /* ── done ─────────────────────────────────────────────────────────── */
  if (done) {
    return (
      <div className="mx-auto max-w-lg px-6 pb-24 pt-16">
        <Surface className="p-8 text-center animate-rise">
          <div className="mx-auto grid size-16 place-items-center rounded-full neu-inset">
            <CheckCircle2 className="size-8 text-emerald-600" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-800">Thanks — got it</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Your report has been added. If several people in your block report something similar,
            the health centre will be alerted and your block warden will be asked to check the water
            supply.
          </p>

          <Surface inset small className="mt-6 px-4 py-3.5 text-left">
            <p className="text-xs leading-relaxed text-slate-600">
              <strong className="font-semibold">If you feel worse</strong> — especially if you cannot
              keep fluids down, have a high fever, or feel faint — go to the campus health centre
              rather than waiting. This form is not a substitute for being seen.
            </p>
          </Surface>

          <div className="mt-6 flex gap-2">
            <Link href="/" className="flex-1">
              <NeuButton className="w-full">Done</NeuButton>
            </Link>
            <Link href="/radar" className="flex-1">
              <NeuButton variant="primary" className="w-full">
                See campus status
              </NeuButton>
            </Link>
          </div>
        </Surface>
      </div>
    );
  }

  const canNext = [Boolean(student), symptoms.length > 0, whenHours !== null][step];

  return (
    <div className="mx-auto max-w-lg px-6 pb-24 pt-10">
      {/* progress */}
      <div className="mb-6 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-500',
              i <= step ? 'bg-slate-700' : 'bg-slate-300/70',
            )}
          />
        ))}
      </div>

      <Surface className="p-7 animate-rise">
        {/* ── step 0: who ── */}
        {step === 0 && (
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <HeartPulse className="size-3.5" />
              Step 1 of 3
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">
              Not feeling well?
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              This takes about thirty seconds. It helps us spot a bad water tank or a bad batch of
              food before it makes a lot of people ill.
            </p>

            {student ? (
              <Surface inset small className="mt-6 flex items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">{student.name}</div>
                  <div className="text-xs text-slate-500">
                    {student.blockId
                      ? `Block ${student.blockId.replace('block-', '')} · Floor ${student.floor} · Room ${student.room}`
                      : 'Day scholar'}
                  </div>
                </div>
                <NeuButton variant="ghost" onClick={() => setStudent(null)}>
                  Change
                </NeuButton>
              </Surface>
            ) : (
              <div className="relative mt-6">
                <div className="flex items-center gap-3 rounded-xl neu-inset-sm px-4 py-3.5">
                  <Search className="size-4 shrink-0 text-slate-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. 2502050001 or student name"
                    className="w-full bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400 font-mono"
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setQuery('2502050001')}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <Sparkles className="size-3" /> Use demo: 2502050001
                  </button>
                  <Link href="/login" className="text-slate-400 hover:text-slate-700">
                    Already signed in? Open /app →
                  </Link>
                </div>

                {hits.length > 0 && (
                  <Surface className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto p-2">
                    {hits.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => {
                          setStudent(h);
                          setQuery('');
                        }}
                        className="flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/70"
                      >
                        <span className="text-sm font-medium text-slate-800">{h.name}</span>
                        <span className="text-xs text-slate-500 font-mono">
                          {h.registration}
                          {h.blockId ? ` · ${h.blockId.replace('block-', '')} ${h.room}` : ''}
                        </span>
                      </button>
                    ))}
                  </Surface>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── step 1: what ── */}
        {step === 1 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Step 2 of 3
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">
              What are you feeling?
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">Tap everything that applies.</p>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {SYMPTOMS.map((s) => {
                const on = symptoms.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggle(s)}
                    className={cn(
                      'rounded-xl px-4 py-3.5 text-sm font-medium transition-all min-h-[44px]',
                      on ? 'neu-inset-sm text-slate-900 font-bold bg-white' : 'neu-raised-sm text-slate-600',
                    )}
                  >
                    {SYMPTOM_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── step 2: when + how bad ── */}
        {step === 2 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Step 3 of 3
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">
              When did it start?
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              A rough answer is fine — it helps us work out whether it was the water or a meal.
            </p>

            <div className="mt-6 space-y-2.5">
              {WHEN_OPTIONS.map((o) => (
                <button
                  key={o.hours}
                  onClick={() => setWhenHours(o.hours)}
                  className={cn(
                    'w-full rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-all min-h-[44px]',
                    whenHours === o.hours
                      ? 'neu-inset-sm text-slate-900 font-bold bg-white'
                      : 'neu-raised-sm text-slate-600',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="mt-7">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                How bad is it?
              </label>
              <div className="mt-2.5 flex gap-2">
                {[
                  { n: 1, label: 'Mild' },
                  { n: 2, label: 'Annoying' },
                  { n: 3, label: 'Bad' },
                  { n: 4, label: 'Very bad' },
                ].map((o) => (
                  <button
                    key={o.n}
                    onClick={() => setSeverity(o.n)}
                    className={cn(
                      'flex-1 rounded-xl px-2 py-3 text-xs font-semibold transition-all min-h-[44px]',
                      severity === o.n
                        ? o.n >= 3
                          ? 'neu-inset-sm text-red-600 font-bold bg-white'
                          : 'neu-inset-sm text-slate-900 font-bold bg-white'
                        : 'neu-raised-sm text-slate-500',
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* nav */}
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <NeuButton onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1.5">
              <ArrowLeft className="size-4" />
              Back
            </NeuButton>
          )}
          {step < 2 ? (
            <NeuButton
              variant="primary"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="flex flex-1 items-center justify-center gap-1.5 py-3"
            >
              Continue
              <ArrowRight className="size-4" />
            </NeuButton>
          ) : (
            <NeuButton
              variant="primary"
              disabled={!canNext || saving}
              onClick={submit}
              className="flex flex-1 items-center justify-center gap-2 py-3"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? 'Sending…' : 'Submit report'}
            </NeuButton>
          )}
        </div>
      </Surface>

      <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
        Your name and room are only visible to the campus health centre. Wardens see totals by block,
        never who reported what.
      </p>
    </div>
  );
}

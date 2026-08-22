'use client';

/**
 * The student self-report.
 *
 * Two steps, because a single long form on a phone gets abandoned halfway and
 * a half-filled report is worth nothing. Step one is symptoms — the only
 * genuinely required input. Step two is timing and meals, which is where the
 * evidence that separates food from water actually comes from.
 *
 * Self-reports are weighted 0.4 against a doctor's 1.0. They are not weaker
 * because students are unreliable; they are weaker because nobody examined the
 * patient. What they buy is a day and a half of warning.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NeuButton, Spinner } from '@/components/neu';
import { poolFor, POOLS, type PoolId } from '@/lib/domain/pools';
import { SYMPTOM_LABEL, type Symptom, type MessMealRow } from '@/lib/db/types';
import { cn } from '@/lib/utils';

const SYMPTOM_GROUPS: { group: string; symptoms: Symptom[] }[] = [
  {
    group: 'Stomach & digestion',
    symptoms: ['vomiting', 'loose_motions', 'stomach_pain', 'nausea', 'dehydration'],
  },
  {
    group: 'Throat & breathing',
    symptoms: ['cough', 'sore_throat', 'runny_nose', 'breathlessness'],
  },
  {
    group: 'Fever & whole body',
    symptoms: ['fever', 'body_ache', 'headache', 'weakness'],
  },
  {
    group: 'Skin & allergic',
    symptoms: ['rash', 'itching'],
  },
];

const ONSET_OPTIONS = [
  { label: 'Just now', sub: 'under 2 h', hours: 2 },
  { label: 'This morning', sub: '4–8 h', hours: 6 },
  { label: 'Yesterday', sub: '~24 h', hours: 24 },
  { label: 'Two days ago', sub: '~48 h', hours: 48 },
];

interface StudentReportClientProps {
  student: {
    id: string;
    name: string;
    registration: string;
    blockName: string | null;
    floor: number | null;
    room: string | null;
  };
  recentMeals: MessMealRow[];
}

export function StudentReportClient({ student, recentMeals }: StudentReportClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [onsetOffsetHours, setOnsetOffsetHours] = useState<number>(4);
  const [severity, setSeverity] = useState<number>(3);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSymptom = (s: Symptom) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const toggleMeal = (mealId: string) =>
    setSelectedMeals((prev) =>
      prev.includes(mealId) ? prev.filter((id) => id !== mealId) : [...prev, mealId],
    );

  const predictedPool: PoolId = poolFor(symptoms);
  const poolMeta = POOLS[predictedPool];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (symptoms.length === 0) {
      setError('Please select at least one symptom.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const onsetDate = new Date(Date.now() - onsetOffsetHours * 3600_000).toISOString();

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          symptoms,
          onsetAt: onsetDate,
          severity,
          mealIds: selectedMeals,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to submit report');

      router.push('/app/pool');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting report');
      setSubmitting(false);
    }
  }

  const choice = (on: boolean) =>
    cn(
      'min-h-[46px] px-3.5 py-2.5 text-left text-[12px] font-semibold transition-colors',
      on ? 'bg-ink text-paper-bright' : 'bg-paper-bright text-ink-soft hover:text-ink',
    );

  return (
    <div className="animate-rise">
      {/* ── step header ───────────────────────────────────────────────── */}
      <div className="flex items-end justify-between border-b border-ink pb-3">
        <div>
          <span className="eyebrow">Step {step} of 2</span>
          <h1 className="mt-1.5 text-[18px] font-bold tracking-[-0.02em] text-ink">
            {step === 1 ? 'What symptoms do you have?' : 'When, and what did you eat?'}
          </h1>
        </div>
        <div className="flex gap-1">
          <span className={cn('h-1 w-8', step >= 1 ? 'bg-ink' : 'bg-line-light')} />
          <span className={cn('h-1 w-8', step >= 2 ? 'bg-ink' : 'bg-line-light')} />
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted-ink">
        Reporting as <strong className="font-semibold text-ink">{student.name}</strong> ·{' '}
        <span className="font-mono">{student.registration}</span>
        {student.blockName ? ` · Block ${student.blockName}` : ''}
      </p>

      {step === 1 ? (
        <div className="mt-7 space-y-7">
          {SYMPTOM_GROUPS.map((group) => (
            <div key={group.group}>
              <h3 className="meta">{group.group}</h3>
              <div className="mt-2.5 grid grid-cols-2 gap-px bg-line-light p-px">
                {group.symptoms.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className={choice(symptoms.includes(s))}
                  >
                    {SYMPTOM_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {symptoms.length > 0 && (
            <div className="flex items-center justify-between border-l-2 border-ink bg-paper-bright px-4 py-3">
              <span className="text-[12px] font-semibold text-ink">
                Grouped with: {poolMeta.label}
              </span>
              <span className="meta tabular-nums">
                {symptoms.length} symptom{symptoms.length === 1 ? '' : 's'}
              </span>
            </div>
          )}

          {error && (
            <div className="border-l-2 border-thermal-red bg-paper-bright px-4 py-2.5 text-[12px] text-thermal-red">
              {error}
            </div>
          )}

          <NeuButton
            type="button"
            variant="primary"
            disabled={symptoms.length === 0}
            onClick={() => {
              setError(null);
              setStep(2);
            }}
            className="w-full py-3.5"
          >
            Continue →
          </NeuButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-8">
          {/* onset */}
          <div>
            <h3 className="meta">When did it begin?</h3>
            <div className="mt-2.5 grid grid-cols-2 gap-px bg-line-light p-px sm:grid-cols-4">
              {ONSET_OPTIONS.map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setOnsetOffsetHours(opt.hours)}
                  className={cn(choice(onsetOffsetHours === opt.hours), 'text-center')}
                >
                  <span className="block">{opt.label}</span>
                  <span className="block text-[10px] font-normal opacity-70">{opt.sub}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-ink">
              Whether everyone fell ill in the same few hours or across days is what separates a bad
              meal from a bad water tank.
            </p>
          </div>

          {/* severity */}
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="meta">How bad is it?</h3>
              <span className="text-[12px] font-semibold tabular-nums text-ink">{severity} / 5</span>
            </div>
            <div className="mt-2.5 grid grid-cols-5 gap-px bg-line-light p-px">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeverity(lvl)}
                  className={cn(choice(severity === lvl), 'text-center text-[14px] font-bold')}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* meals */}
          <div>
            <h3 className="meta">Mess meals in the last 72 hours</h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-ink">
              Tick what you ate. If a meal turns out to be the source, only the students who ate it
              get an advisory — nobody else is bothered.
            </p>
            <div className="mt-2.5 max-h-56 space-y-px overflow-y-auto bg-line-light p-px">
              {recentMeals.map((m) => {
                const checked = selectedMeals.includes(m.id);
                const d = new Date(m.opensAt);
                const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMeal(m.id)}
                    className={cn(choice(checked), 'block w-full')}
                  >
                    <span className="capitalize">
                      {day} {m.mealType}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] font-normal opacity-70">
                      {m.menuItems.join(', ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="border-l-2 border-thermal-red bg-paper-bright px-4 py-2.5 text-[12px] text-thermal-red">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <NeuButton type="button" onClick={() => setStep(1)} className="py-3.5">
              ← Back
            </NeuButton>
            <NeuButton type="submit" variant="primary" disabled={submitting} className="flex-1 py-3.5">
              {submitting ? <Spinner className="border-paper-bright/40 border-t-paper-bright" /> : 'Submit report'}
            </NeuButton>
          </div>
        </form>
      )}
    </div>
  );
}

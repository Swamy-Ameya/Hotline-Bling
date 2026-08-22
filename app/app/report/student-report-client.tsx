'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft, Send, Sparkles, Utensils, AlertCircle } from 'lucide-react';
import { Surface, NeuButton, Spinner } from '@/components/neu';
import { poolFor, POOLS, type PoolId } from '@/lib/domain/pools';
import { SYMPTOM_LABEL, type Symptom, type MessMealRow } from '@/lib/db/types';

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

  const toggleSymptom = (s: Symptom) => {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const toggleMeal = (mealId: string) => {
    setSelectedMeals((prev) =>
      prev.includes(mealId) ? prev.filter((id) => id !== mealId) : [...prev, mealId],
    );
  };

  const predictedPool: PoolId = poolFor(symptoms);
  const poolMeta = POOLS[predictedPool];

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      router.push('/app/pool');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting report');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 animate-rise">
      {/* Stepper Header */}
      <Surface className="p-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Step {step} of 2
          </span>
          <h1 className="text-base font-bold text-slate-800">
            {step === 1 ? 'What symptoms do you have?' : 'Onset & Mess Meals'}
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`size-2.5 rounded-full ${
              step >= 1 ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          />
          <span
            className={`size-2.5 rounded-full ${
              step >= 2 ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          />
        </div>
      </Surface>

      {/* Auto-filled identity reminder */}
      <div className="px-2 text-xs text-slate-500 flex items-center justify-between">
        <span>
          Reporting as: <strong className="text-slate-800">{student.name}</strong> ({student.registration}
          {student.blockName ? ` · Block ${student.blockName}` : ''})
        </span>
      </div>

      {step === 1 ? (
        <Surface className="p-6 space-y-6">
          {SYMPTOM_GROUPS.map((group) => (
            <div key={group.group}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                {group.group}
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {group.symptoms.map((s) => {
                  const selected = symptoms.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSymptom(s)}
                      className={`min-h-[48px] px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all active:scale-95 ${
                        selected
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'neu-raised-sm text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <span>{SYMPTOM_LABEL[s]}</span>
                      {selected && <Check className="size-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Live Pool Classification Pill */}
          {symptoms.length > 0 && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-950">
                  Assigned pool: {poolMeta.label}
                </span>
              </div>
              <span className="text-[11px] text-indigo-600 font-medium">
                {symptoms.length} symptom{symptoms.length === 1 ? '' : 's'}
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
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
            className="w-full py-3 text-sm flex items-center justify-center gap-2"
          >
            Continue to Step 2 <ArrowRight className="size-4" />
          </NeuButton>
        </Surface>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Onset Time Selection */}
          <Surface className="p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              When did symptoms begin?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Just now (< 2h)', hours: 2 },
                { label: 'This morning (4-8h)', hours: 6 },
                { label: 'Yesterday (~24h)', hours: 24 },
                { label: '2 days ago (~48h)', hours: 48 },
              ].map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setOnsetOffsetHours(opt.hours)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-center transition-all ${
                    onsetOffsetHours === opt.hours
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'neu-raised-sm text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Surface>

          {/* Severity Slider */}
          <Surface className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Severity Rating (1 = mild, 5 = severe)
              </h3>
              <span className="text-sm font-bold text-slate-800 tabular-nums">
                Level {severity}/5
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeverity(lvl)}
                  className={`min-h-[44px] rounded-xl text-sm font-bold transition-all ${
                    severity === lvl
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'neu-raised-sm text-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </Surface>

          {/* Recent Mess Meals Eaten */}
          <Surface className="p-6 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Utensils className="size-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mess meals eaten in last 72h
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Helps epidemiologists isolate contaminated meal sittings from water issues.
            </p>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {recentMeals.map((m) => {
                const checked = selectedMeals.includes(m.id);
                const d = new Date(m.opensAt);
                const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMeal(m.id)}
                    className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all ${
                      checked
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'neu-inset-sm text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="capitalize">{day} {m.mealType}</span>
                      <span className="block text-[10px] opacity-75 truncate max-w-xs font-normal">
                        {m.menuItems.join(', ')}
                      </span>
                    </div>
                    {checked && <Check className="size-4 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </Surface>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <NeuButton
              type="button"
              onClick={() => setStep(1)}
              className="py-3 px-4 text-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="size-4" /> Back
            </NeuButton>

            <NeuButton
              type="submit"
              variant="primary"
              disabled={submitting}
              className="flex-1 py-3 text-sm flex items-center justify-center gap-2"
            >
              {submitting ? <Spinner /> : <>Submit Report <Send className="size-4" /></>}
            </NeuButton>
          </div>
        </form>
      )}
    </div>
  );
}

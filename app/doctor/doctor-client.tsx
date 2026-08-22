'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  Search,
  Stethoscope,
  UtensilsCrossed,
  User,
  Sparkles,
} from 'lucide-react';
import { NeuButton, SectionTitle, Surface, timeAgo } from '@/components/neu';
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

interface MealHit {
  id: string;
  mealType: string;
  menuItems: string[];
  opensAt: string;
}

const SYMPTOMS = Object.keys(SYMPTOM_LABEL) as Symptom[];

const COMMON_DIAGNOSES = [
  'Acute gastroenteritis',
  'Food poisoning (suspected)',
  'Viral fever',
  'Dehydration',
  'Traveller’s diarrhoea',
];

export function DoctorClient({ recentCount }: { recentCount: number }) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<StudentHit[]>([]);
  const [student, setStudent] = useState<StudentHit | null>(null);
  const [meals, setMeals] = useState<MealHit[]>([]);

  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [onset, setOnset] = useState('');
  const [severity, setSeverity] = useState(3);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ name: string; meals: number } | null>(null);

  /* default onset to a few hours ago — that is nearly always the honest answer */
  useEffect(() => {
    const d = new Date(Date.now() - 6 * 3600_000);
    d.setMinutes(0, 0, 0);
    setOnset(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  }, []);

  /* typeahead */
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

  async function pick(hit: StudentHit) {
    setStudent(hit);
    setQuery('');
    setHits([]);
    const res = await fetch(`/api/students?exact=${encodeURIComponent(hit.registration)}`);
    const json = await res.json();
    setMeals(json.recentMeals ?? []);
  }

  function toggle(s: Symptom) {
    setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  const canSave = student && symptoms.length > 0 && onset && !saving;

  async function save() {
    if (!student) return;
    setSaving(true);
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: student.registration,
          symptoms,
          onsetAt: new Date(onset).toISOString(),
          severity,
          diagnosis: diagnosis || undefined,
          prescription: prescription || undefined,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSaved({ name: student.name, meals: json.mealsLinked ?? 0 });
        reset();
      }
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setStudent(null);
    setMeals([]);
    setSymptoms([]);
    setSeverity(3);
    setDiagnosis('');
    setPrescription('');
    setNotes('');
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-8">
      <Surface className="mb-6 p-7 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <Stethoscope className="size-3.5" />
              Campus health centre
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">
              Record a consultation
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
              Look the student up and fill this in during the visit. Their block, floor and room come
              from the roster, and the meals they collected are pulled from the mess scans — so there
              is nothing to ask about and nothing to type twice.
            </p>
          </div>
          <Surface inset small className="px-4 py-3 text-center">
            <div className="text-2xl font-bold tabular-nums text-slate-800">{recentCount}</div>
            <div className="text-[11px] text-slate-500">seen in 72h</div>
          </Surface>
        </div>
      </Surface>

      {saved && (
        <Surface className="mb-6 flex items-start gap-3 border border-emerald-200/60 bg-emerald-50/60 p-5 animate-rise">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div>
            <div className="text-sm font-semibold text-emerald-800">
              Consultation saved for {saved.name}
            </div>
            <p className="mt-0.5 text-xs text-emerald-700">
              {saved.meals > 0
                ? `${saved.meals} meals from the last three days were linked automatically.`
                : 'No recent mess scans found for this student.'}{' '}
              It is already counted on the dashboard.
            </p>
          </div>
          <NeuButton variant="ghost" className="ml-auto" onClick={() => setSaved(null)}>
            Dismiss
          </NeuButton>
        </Surface>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* ── student lookup ── */}
          <Surface className="p-6 animate-rise stagger-1">
            <SectionTitle hint="Registration number, name, or room">Student</SectionTitle>

            {student ? (
              <Surface inset small className="flex items-center gap-4 px-4 py-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full neu-raised-sm text-slate-500">
                  <User className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">{student.name}</div>
                  <div className="text-xs text-slate-500">
                    <span className="font-mono">{student.registration}</span>
                    {student.blockId
                      ? ` · Block ${student.blockId.replace('block-', '')}, Floor ${student.floor}, Room ${student.room}`
                      : ' · Day scholar'}
                  </div>
                </div>
                <NeuButton variant="ghost" onClick={reset}>
                  Change
                </NeuButton>
              </Surface>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-3 rounded-xl neu-inset-sm px-4 py-3">
                  <Search className="size-4 shrink-0 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Start typing a registration (e.g. 2502050001) or name…"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 font-mono"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setQuery('2502050001')}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <Sparkles className="size-3" /> Quick lookup: 2502050001 (Ishaan Reddy)
                  </button>
                </div>

                {hits.length > 0 && (
                  <Surface className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto p-2">
                    {hits.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => pick(h)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/70"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-800">{h.name}</div>
                          <div className="text-xs text-slate-500">
                            <span className="font-mono font-semibold">{h.registration}</span>
                            {h.blockId
                              ? ` · ${h.blockId.replace('block-', '')} ${h.room}`
                              : ' · Day scholar'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </Surface>
                )}
              </div>
            )}
          </Surface>

          {/* ── symptoms ── */}
          <Surface className="p-6 animate-rise stagger-2">
            <SectionTitle hint="Tap everything that applies">Symptoms</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => {
                const on = symptoms.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggle(s)}
                    className={cn(
                      'rounded-xl px-3.5 py-2 text-sm font-medium transition-all',
                      on ? 'neu-inset-sm text-slate-900 bg-white font-semibold' : 'neu-raised-sm text-slate-600',
                    )}
                  >
                    {SYMPTOM_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </Surface>

          {/* ── onset + severity ── */}
          <Surface className="p-6 animate-rise stagger-3">
            <SectionTitle hint="When did symptoms first appear?">Onset & severity</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Approximate onset
                </label>
                <div className="mt-2 rounded-xl neu-inset-sm px-4 py-3">
                  <input
                    type="datetime-local"
                    value={onset}
                    onChange={(e) => setOnset(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Severity (1–5)
                </label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={cn(
                        'flex-1 rounded-xl py-3 text-sm font-bold transition-all',
                        severity === lvl
                          ? 'neu-inset-sm text-slate-900 bg-white'
                          : 'neu-raised-sm text-slate-500',
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Surface>

          {/* ── clinical notes ── */}
          <Surface className="p-6 animate-rise stagger-4">
            <SectionTitle hint="Optional, kept in student's record">Clinical notes</SectionTitle>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Working diagnosis
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {COMMON_DIAGNOSES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiagnosis(d)}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                        diagnosis === d
                          ? 'neu-inset-sm text-slate-900 bg-white font-semibold'
                          : 'neu-raised-sm text-slate-600',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="mt-2 rounded-xl neu-inset-sm px-4 py-2.5">
                  <input
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Or type a custom diagnosis…"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Prescription / advice given
                </label>
                <div className="mt-2 rounded-xl neu-inset-sm px-4 py-2.5">
                  <input
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    placeholder="e.g. ORS sachets, Metronidazole 400mg TDS x3d, light diet"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Doctor notes
                </label>
                <div className="mt-2 rounded-xl neu-inset-sm px-4 py-2.5">
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Rest advised, review if no improvement in 24 hours…"
                    className="w-full resize-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </Surface>

          {/* ── save CTA ── */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {canSave ? 'Ready to save.' : 'Select a student and at least one symptom to save.'}
            </span>
            <NeuButton
              variant="primary"
              disabled={!canSave}
              onClick={save}
              className="flex items-center gap-2 px-6 py-3"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? 'Saving…' : 'Save consultation'}
            </NeuButton>
          </div>
        </div>

        {/* ── side: mess history ── */}
        <div>
          <Surface className="p-6 animate-rise stagger-2">
            <div className="mb-4 flex items-center gap-2">
              <UtensilsCrossed className="size-4 text-slate-400" />
              <h2 className="text-base font-bold text-slate-800">Recent mess meals</h2>
            </div>

            {!student ? (
              <p className="text-xs leading-relaxed text-slate-400">
                Look up a student to see the meals they collected in the last 72 hours.
              </p>
            ) : meals.length === 0 ? (
              <p className="text-xs leading-relaxed text-slate-400">
                No mess card scans recorded in the last 72 hours for this student.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  {meals.length} meal{meals.length === 1 ? '' : 's'} linked automatically from card scans:
                </p>
                <ul className="space-y-2">
                  {meals.map((m) => (
                    <li key={m.id}>
                      <Surface inset small className="px-3.5 py-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold capitalize text-slate-700">
                          <span>{m.mealType}</span>
                          <span className="text-[11px] font-normal text-slate-400">
                            {timeAgo(m.opensAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">
                          {m.menuItems.join(' · ')}
                        </p>
                      </Surface>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Surface>
        </div>
      </div>
    </div>
  );
}

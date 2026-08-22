'use client';

/**
 * The clinic form.
 *
 * This is the highest-value input in the whole system — a doctor-confirmed
 * case is weighted 1.0 against a self-report's 0.4 — so the form's only job is
 * to be fast enough that a doctor fills it in during the visit rather than
 * after it.
 *
 * Everything derivable is derived: the roster supplies block, floor and room,
 * and the mess card scans supply which meals the student collected. Nothing
 * here is typed twice.
 */

import React, { useEffect, useState } from 'react';
import { NeuButton, Spinner, timeAgo } from '@/components/neu';
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

const SEVERITY_LABEL = ['', 'Mild', 'Mild+', 'Moderate', 'Severe', 'Very severe'];

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

  /* Default onset to a few hours ago — nearly always the honest answer.
     Deferred a tick rather than computed during render, so the server and the
     first client paint agree on the field's value. */
  useEffect(() => {
    const t = setTimeout(() => {
      const d = new Date(Date.now() - 6 * 3600_000);
      d.setMinutes(0, 0, 0);
      setOnset(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  /* typeahead */
  useEffect(() => {
    if (query.trim().length < 2 || student) {
      const clear = setTimeout(() => setHits([]), 0);
      return () => clearTimeout(clear);
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

  const canSave = !!student && symptoms.length > 0 && !!onset && !saving;

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

  const field =
    'w-full border border-line bg-paper-bright px-4 py-3 text-[13px] text-ink outline-none transition-colors placeholder:text-line focus:border-ink';

  return (
    <div className="editorial pb-24 pt-8">
      {/* ═══ header ════════════════════════════════════════════════════ */}
      <div className="flex items-baseline justify-between gap-4 border-b border-line-light pb-3">
        <span className="eyebrow">Campus health centre</span>
        <span className="meta tabular-nums">{recentCount} seen in 72 h</span>
      </div>

      <div className="grid gap-6 pt-7 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="display text-[clamp(1.8rem,3.6vw,2.6rem)] text-ink">
            Record a consultation
          </h1>
          <p className="mt-4 max-w-xl text-[14px] leading-[1.6] text-muted-ink">
            Look the student up and fill this in during the visit. Block, floor and room come from
            the roster, and the meals they collected come from the mess scans — nothing to ask
            about, nothing typed twice.
          </p>
        </div>
      </div>

      {saved && (
        <div className="mt-8 border-l-2 border-ink bg-paper-bright px-5 py-4 animate-rise">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[13px] font-semibold text-ink">
                Consultation saved for {saved.name}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-ink">
                {saved.meals > 0
                  ? `${saved.meals} meals from the last three days were linked automatically from card scans.`
                  : 'No mess card scans found for this student in the last three days.'}{' '}
                It already counts on the dashboard.
              </p>
            </div>
            <NeuButton variant="ghost" onClick={() => setSaved(null)}>
              Dismiss
            </NeuButton>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {/* ── 01 student ─────────────────────────────────────────── */}
          <section>
            <div className="flex items-baseline justify-between border-b border-ink pb-2">
              <span className="eyebrow">01 / Student</span>
              <span className="meta">Registration, name or room</span>
            </div>

            {student ? (
              <div className="mt-4 flex items-center justify-between gap-4 border border-line-light bg-paper-bright px-4 py-3.5">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-ink">{student.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-ink">
                    <span className="font-mono">{student.registration}</span>
                    {student.blockId
                      ? ` · Block ${student.blockId.replace('block-', '')} · Floor ${student.floor} · Room ${student.room}`
                      : ' · Day scholar'}
                  </div>
                </div>
                <NeuButton variant="ghost" onClick={reset}>
                  Change
                </NeuButton>
              </div>
            ) : (
              <div className="relative mt-4">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Registration number or name…"
                  className={cn(field, 'font-mono')}
                />
                <button
                  type="button"
                  onClick={() => setQuery('2502050001')}
                  className="mt-2 meta transition-colors hover:text-ink"
                >
                  Quick lookup · 2502050001 Ishaan Reddy →
                </button>

                {hits.length > 0 && (
                  <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto border border-line bg-paper-bright">
                    {hits.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => pick(h)}
                        className="flex w-full items-center justify-between border-b border-line-light px-4 py-2.5 text-left transition-colors hover:bg-paper-sunk"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-ink">
                            {h.name}
                          </span>
                          <span className="block text-[11px] text-muted-ink">
                            <span className="font-mono">{h.registration}</span>
                            {h.blockId
                              ? ` · ${h.blockId.replace('block-', '')} ${h.room}`
                              : ' · Day scholar'}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── 02 symptoms ────────────────────────────────────────── */}
          <section className="mt-12">
            <div className="flex items-baseline justify-between border-b border-ink pb-2">
              <span className="eyebrow">02 / Symptoms</span>
              <span className="meta">Everything that applies</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-px bg-line-light p-px">
              {SYMPTOMS.map((s) => {
                const on = symptoms.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggle(s)}
                    className={cn(
                      'px-3.5 py-2 text-[12px] font-medium transition-colors',
                      on
                        ? 'bg-ink text-paper-bright'
                        : 'bg-paper-bright text-ink-soft hover:text-ink',
                    )}
                  >
                    {SYMPTOM_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── 03 onset + severity ────────────────────────────────── */}
          <section className="mt-12">
            <div className="flex items-baseline justify-between border-b border-ink pb-2">
              <span className="eyebrow">03 / Onset &amp; severity</span>
              <span className="meta">Timing carries half the evidence</span>
            </div>

            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="meta">Approximate onset</label>
                <input
                  type="datetime-local"
                  value={onset}
                  onChange={(e) => setOnset(e.target.value)}
                  className={cn(field, 'mt-2')}
                />
                <p className="mt-2 text-[11px] leading-relaxed text-muted-ink">
                  Approximate is fine. Whether onsets cluster in hours or spread over days is what
                  separates a bad meal from a bad tank.
                </p>
              </div>

              <div>
                <label className="meta">Severity · {SEVERITY_LABEL[severity]}</label>
                <div className="mt-2 flex gap-px bg-line-light p-px">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={cn(
                        'flex-1 py-3 text-[13px] font-bold tabular-nums transition-colors',
                        severity === lvl
                          ? 'bg-ink text-paper-bright'
                          : 'bg-paper-bright text-muted-ink hover:text-ink',
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── 04 clinical ────────────────────────────────────────── */}
          <section className="mt-12">
            <div className="flex items-baseline justify-between border-b border-ink pb-2">
              <span className="eyebrow">04 / Clinical notes</span>
              <span className="meta">Optional · stays in the record</span>
            </div>

            <div className="mt-4 space-y-6">
              <div>
                <label className="meta">Working diagnosis</label>
                <div className="mt-2 flex flex-wrap gap-px bg-line-light p-px">
                  {COMMON_DIAGNOSES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiagnosis(d)}
                      className={cn(
                        'px-3 py-1.5 text-[11px] font-medium transition-colors',
                        diagnosis === d
                          ? 'bg-ink text-paper-bright'
                          : 'bg-paper-bright text-ink-soft hover:text-ink',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Or type a custom diagnosis…"
                  className={cn(field, 'mt-2')}
                />
              </div>

              <div>
                <label className="meta">Prescription / advice given</label>
                <input
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="ORS sachets, light diet, review in 24 h…"
                  className={cn(field, 'mt-2')}
                />
              </div>

              <div>
                <label className="meta">Doctor notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Rest advised, review if no improvement in 24 hours…"
                  className={cn(field, 'mt-2 resize-none')}
                />
              </div>
            </div>
          </section>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ink pt-5">
            <span className="text-[12px] text-muted-ink">
              {canSave
                ? 'Ready to save. This counts as a doctor-confirmed case.'
                : 'Select a student and at least one symptom.'}
            </span>
            <NeuButton variant="primary" disabled={!canSave} onClick={save}>
              {saving && <Spinner className="border-paper-bright/40 border-t-paper-bright" />}
              {saving ? 'Saving…' : 'Save consultation'}
            </NeuButton>
          </div>
        </div>

        {/* ── side: meal history ───────────────────────────────────── */}
        <aside className="lg:col-span-4">
          <div className="border-b border-ink pb-2">
            <span className="eyebrow">Recent mess meals</span>
          </div>

          {!student ? (
            <p className="mt-4 text-[12px] leading-relaxed text-muted-ink">
              Look up a student to see the meals they collected in the last 72 hours. These come
              from card scans, so they are already recorded — the doctor never has to ask what
              somebody ate.
            </p>
          ) : meals.length === 0 ? (
            <p className="mt-4 text-[12px] leading-relaxed text-muted-ink">
              No mess card scans in the last 72 hours for this student.
            </p>
          ) : (
            <>
              <p className="mt-4 text-[12px] text-muted-ink">
                {meals.length} meal{meals.length === 1 ? '' : 's'} linked automatically:
              </p>
              <ul className="mt-3">
                {meals.map((m) => (
                  <li key={m.id} className="border-b border-line-light py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold capitalize text-ink">
                        {m.mealType}
                      </span>
                      <span className="meta">{timeAgo(m.opensAt)}</span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-muted-ink">
                      {m.menuItems.join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

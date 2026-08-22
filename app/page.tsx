import Link from 'next/link';
import {
  ArrowRight,
  Beaker,
  Droplets,
  HeartPulse,
  MapPin,
  Smartphone,
  Stethoscope,
  UtensilsCrossed,
} from 'lucide-react';
import { AppShell } from '@/components/neu/shell';
import { NeuButton, RiskBadge, Surface } from '@/components/neu';
import { buildSituationReport } from '@/lib/domain/surveillance';
import { countStudents } from '@/lib/db';
import { BLOCKS } from '@/lib/domain/campus';
import { QRCodeSVG } from '@/components/qr-code';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    icon: Stethoscope,
    title: 'The doctor writes it down once',
    body: 'During a visit, the campus doctor records symptoms, when they started, and what was prescribed. The student’s block, floor and room come from the roster — nothing to ask, nothing typed twice.',
  },
  {
    icon: HeartPulse,
    title: 'Students report from their phone',
    body: 'Most people never visit a health centre for a mild stomach upset, and the ones who do turn up a day late. A thirty-second form catches the rest, which is where the head start comes from.',
  },
  {
    icon: UtensilsCrossed,
    title: 'The mess data is already there',
    body: 'Every plate collected is a card scan. That tells us who ate what and when, without anyone entering it by hand.',
  },
  {
    icon: MapPin,
    title: 'We look for things sitting together',
    body: 'Same block, same floor, same meal, same few hours. When reports cluster somewhere they normally would not, the block shows up on the map.',
  },
];

export default async function HomePage() {
  const report = buildSituationReport();
  const students = countStudents();

  return (
    <AppShell>
      {/* ── hero ── */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full neu-raised-sm px-3.5 py-1.5 text-xs font-semibold text-slate-500">
              <Droplets className="size-3.5" />
              Manipal University Jaipur
            </span>

            <h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight text-slate-800">
              Find the bad tank
              <br />
              <span className="text-slate-400">before twenty students</span>
              <br />
              get sick.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-500">
              Hostel stomach bugs get noticed on day three, once fifteen or twenty people are ill and
              somebody finally connects them. The information existed on day one — it was just spread
              across a warden’s register, the clinic, the mess complaint book and a floor WhatsApp
              group. We put it in one place and watch for things that cluster.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/radar">
                <NeuButton variant="primary" className="flex items-center gap-2 px-6 py-3 text-base">
                  Open the dashboard
                  <ArrowRight className="size-4" />
                </NeuButton>
              </Link>
              <Link href="/login">
                <NeuButton className="px-6 py-3 text-base">Sign in (Student / Staff)</NeuButton>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              {[
                { v: students.toLocaleString(), l: 'students monitored' },
                { v: BLOCKS.length, l: 'hostel blocks' },
                { v: '3 days', l: 'the gap we close' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold tabular-nums text-slate-800">{s.v}</div>
                  <div className="text-xs text-slate-500">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* live status card */}
          <Surface glow={report.overall} className="p-7 animate-rise stagger-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Campus right now
              </span>
              <RiskBadge level={report.overall} pulse />
            </div>

            <p className="mt-4 text-lg font-semibold leading-snug text-slate-800">
              {report.headline}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { v: report.totalCases, l: 'ill' },
                { v: report.doctorConfirmed, l: 'seen by doctor' },
                { v: report.hotspots.length, l: 'blocks flagged' },
              ].map((s) => (
                <Surface inset small key={s.l} className="px-3 py-3 text-center">
                  <div className="text-2xl font-bold tabular-nums text-slate-800">{s.v}</div>
                  <div className="mt-0.5 text-[11px] leading-tight text-slate-500">{s.l}</div>
                </Surface>
              ))}
            </div>

            {report.failingWaterSources.length > 0 && (
              <Surface inset small className="mt-4 flex items-start gap-2.5 px-4 py-3">
                <Beaker className="mt-0.5 size-4 shrink-0 text-red-500" />
                <div className="text-xs leading-relaxed text-slate-600">
                  <strong className="font-semibold text-slate-800">
                    {report.failingWaterSources[0].name}
                  </strong>{' '}
                  failed its last test. {report.failingWaterSources[0].notes}
                </div>
              </Surface>
            )}

            <Link href="/radar" className="mt-5 block">
              <NeuButton className="w-full">See the map</NeuButton>
            </Link>
          </Surface>
        </div>
      </section>

      {/* ── Judge Scan-In Section ── */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <Surface className="p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                <Smartphone className="size-3.5" /> Mobile PWA Experience
              </div>
              <h2 className="text-2xl font-bold">Scan to open on your phone</h2>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                Scan with your smartphone camera to open the Student PWA. Add to Home Screen, log in as Demo Student in 1 tap, file a self-report, and receive live push alert broadcasts directly to your lock screen.
              </p>
              <div className="pt-2 text-xs text-indigo-200 font-mono">
                Direct URL: https://outbreak-radar-iota.vercel.app/login
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <QRCodeSVG value="https://outbreak-radar-iota.vercel.app/login" size={130} />
              <span className="text-[11px] font-semibold text-slate-300">Scan to Open /login</span>
            </div>
          </div>
        </Surface>
      </section>

      {/* ── how it works ── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">How it works</h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-500">
          Nothing here asks anyone to do new work. Every input already exists on campus — it has just
          never been in the same place at the same time.
        </p>

        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <Surface
              key={s.title}
              press
              className={`p-6 animate-rise stagger-${i + 1}`}
            >
              <span className="grid size-11 place-items-center rounded-xl neu-inset-sm text-slate-600">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-800">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.body}</p>
            </Surface>
          ))}
        </div>
      </section>

      {/* ── the honest bit ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <Surface inset className="p-9">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            What this does not do
          </h2>
          <div className="mt-6 grid gap-7 md:grid-cols-3">
            {[
              {
                t: 'It does not diagnose anyone',
                b: 'It flags places, not people. A doctor decides what is wrong with a patient; this decides which block is worth a visit.',
              },
              {
                t: 'It does not alert anyone on its own',
                b: 'Every advisory is sent by a person. An automated warning fired off unverified reports is how you panic a campus at two in the morning.',
              },
              {
                t: 'It does not track individuals',
                b: 'Wardens see totals by block. Names and rooms stay with the health centre, and a location is never shown when only one or two people are involved.',
              },
            ].map((x) => (
              <div key={x.t}>
                <h3 className="text-sm font-bold text-slate-800">{x.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{x.b}</p>
              </div>
            ))}
          </div>
        </Surface>
      </section>
    </AppShell>
  );
}

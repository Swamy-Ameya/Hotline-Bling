import Link from 'next/link';
import { AppShell } from '@/components/neu/shell';
import { NeuButton, RiskBadge, Stat } from '@/components/neu';
import { buildSituationReport } from '@/lib/domain/surveillance';
import { buildMapBlocks } from '@/lib/domain/campus-view';
import { countStudents } from '@/lib/db';
import { BLOCKS } from '@/lib/domain/campus';
import { QRCodeSVG } from '@/components/qr-code';
import { CampusThermalMap } from '@/components/radar/campus-map';
import { RISK_META, SOURCE_META } from '@/lib/domain/risk';

export const dynamic = 'force-dynamic';

const INPUTS = [
  {
    n: '01',
    t: 'The doctor writes it down once',
    b: 'During a visit the campus doctor records symptoms, when they started and what was prescribed. Block, floor and room come from the roster — nothing to ask, nothing typed twice.',
  },
  {
    n: '02',
    t: 'Students report from their phone',
    b: 'Most people never visit a health centre for a mild stomach upset, and the ones who do turn up a day late. A thirty-second form catches the rest. That is where the head start comes from.',
  },
  {
    n: '03',
    t: 'The mess data already exists',
    b: 'Every plate collected is a card scan. That tells us who ate what and when, without anybody entering it by hand.',
  },
  {
    n: '04',
    t: 'We look for things sitting together',
    b: 'Same block, same floor, same meal, same few hours. When reports cluster where they normally would not, the block heats up on the map.',
  },
];

const LIMITS = [
  {
    t: 'It does not diagnose anyone',
    b: 'It flags places, not people. A doctor decides what is wrong with a patient; this decides which block is worth a visit tonight.',
  },
  {
    t: 'It does not alert anyone on its own',
    b: 'Every advisory is sent by a person. An automated warning fired off unverified reports is how you panic a campus at two in the morning.',
  },
  {
    t: 'It does not track individuals',
    b: 'Wardens see totals by block. Names and rooms stay with the health centre, and a location is never shown when only one or two people are involved.',
  },
];

export default async function HomePage() {
  const report = buildSituationReport();
  const blocks = buildMapBlocks();
  const students = countStudents();
  const top = report.hotspots[0];
  const hot = report.overall !== 'normal';

  return (
    <AppShell>
      {/* ═══ 01 — hero ═══════════════════════════════════════════════════ */}
      <section className="editorial pt-10 pb-0">
        <div className="flex items-baseline justify-between gap-6 border-b border-line-light pb-4">
          <span className="eyebrow">01 / Manipal University Jaipur</span>
          <span className="meta hidden sm:block">Hostel micro-outbreak early warning</span>
        </div>

        <div className="grid gap-8 pt-8 lg:grid-cols-12 lg:gap-10">
          {/* The words get four columns. The map gets eight — it is the
              product, and the copy is a caption for it. */}
          <div className="lg:col-span-4">
            <h1 className="display text-[clamp(2.6rem,6.2vw,4.6rem)] text-ink animate-rise">
              See the
              <br />
              cluster
              <br />
              before it
              <br />
              <span className="text-thermal-red">spreads.</span>
            </h1>

            <p className="mt-7 max-w-md text-[15px] leading-[1.65] text-ink-soft animate-rise stagger-1">
              Hostel stomach bugs get noticed on day three, once fifteen or twenty people are ill
              and somebody finally connects them. The information existed on day one — scattered
              across a warden&rsquo;s register, the clinic, the mess complaint book and a floor
              WhatsApp group. We put it in one place and watch for what clusters.
            </p>

            <div className="mt-8 flex flex-wrap gap-2 animate-rise stagger-2">
              <Link href="/radar">
                <NeuButton variant="primary">Enter platform</NeuButton>
              </Link>
              <Link href="/login">
                <NeuButton>Sign in</NeuButton>
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-line-light pt-6 animate-rise stagger-3">
              <Stat label="Students" value={students.toLocaleString()} />
              <Stat label="Blocks" value={BLOCKS.length} />
              <Stat label="Days earlier" value="3" />
            </div>
          </div>

          {/* Map. Roughly two thirds of the hero's visual weight, by design. */}
          <div className="lg:col-span-8">
            <div className="border border-line-light animate-rise stagger-1">
              <div className="flex items-center justify-between border-b border-line-light bg-paper-bright px-4 py-2">
                <span className="meta">Live campus field · last 72 hours</span>
                <RiskBadge level={report.overall} pulse />
              </div>
              <CampusThermalMap
                blocks={blocks}
                hotspots={report.hotspots}
                className="h-[380px] sm:h-[460px] lg:h-[520px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ status band ═════════════════════════════════════════════════
          Quiet → dense → quiet. When something is wrong this is the one solid
          thermal block on the page, and it stops the eye cold. ═══════════ */}
      <section className="editorial pt-10">
        {hot && top ? (
          <div className="panel-critical animate-rise">
            <div className="grid gap-px sm:grid-cols-[1.6fr_1fr_1fr]">
              <div className="p-6 sm:p-8">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
                  ■ Active cluster
                </div>
                <div className="mt-4 display text-[clamp(1.7rem,3.4vw,2.6rem)]">
                  Block {top.blockName}
                </div>
                <p className="mt-3 max-w-lg text-[13px] leading-relaxed opacity-90">
                  {report.headline}
                </p>
              </div>
              <div className="border-t border-white/25 p-6 sm:border-l sm:border-t-0 sm:p-8">
                <div className="numeral text-[clamp(2.4rem,5vw,3.4rem)]">{top.cases}</div>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">
                  Linked reports
                </div>
              </div>
              <div className="border-t border-white/25 p-6 sm:border-l sm:border-t-0 sm:p-8">
                <div className="text-[13px] font-semibold leading-snug">
                  {SOURCE_META[top.source].label}
                </div>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">
                  Most likely cause
                </div>
                <Link
                  href="/radar"
                  className="mt-5 inline-block border border-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white hover:text-thermal-red"
                >
                  Review cluster
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="panel flex flex-wrap items-center justify-between gap-4 px-6 py-5 animate-rise">
            <div className="flex items-center gap-4">
              <RiskBadge level="normal" />
              <span className="text-[14px] text-ink-soft">{report.headline}</span>
            </div>
            <span className="meta">{RISK_META.normal.blurb}</span>
          </div>
        )}
      </section>

      {/* ═══ 02 — inputs ════════════════════════════════════════════════ */}
      <section className="editorial pt-24">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span className="eyebrow">02 / Where the signal comes from</span>
            <h2 className="mt-6 display text-[clamp(1.9rem,3.6vw,2.9rem)] text-ink">
              Nothing here
              <br />
              asks anyone
              <br />
              to do new work.
            </h2>
          </div>

          <div className="lg:col-span-8">
            {INPUTS.map((s) => (
              <div
                key={s.n}
                className="grid grid-cols-[3rem_1fr] gap-5 border-t border-line-light py-7 first:border-t-0 first:pt-0 md:grid-cols-[4rem_1fr]"
              >
                <span className="numeral pt-1 text-[18px] text-line">{s.n}</span>
                <div>
                  <h3 className="text-[16px] font-semibold text-ink">{s.t}</h3>
                  <p className="mt-2 max-w-xl text-[14px] leading-[1.6] text-muted-ink">{s.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 03 — the contrast that matters ═════════════════════════════ */}
      <section className="editorial pt-24">
        <span className="eyebrow">03 / What a count-threshold would do</span>
        <div className="mt-6 grid gap-px border border-line-light bg-line-light md:grid-cols-2">
          <div className="bg-paper-bright p-8">
            <div className="meta">A dumb threshold</div>
            <p className="mt-4 text-[17px] leading-[1.5] text-ink">
              Seven reports in one block? Alert the campus.
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-ink">
              Seven unrelated stomach upsets land in the same block roughly once a fortnight by pure
              chance. A system that alerts on the count alone cries wolf until nobody reads it.
            </p>
          </div>
          <div className="bg-paper-bright p-8">
            <div className="meta text-thermal-red">This system</div>
            <p className="mt-4 text-[17px] leading-[1.5] text-ink">
              Seven reports, but scattered across four floors and three meals. Watch, not alert.
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-ink">
              We ask how tightly the cases sit together compared with what chance alone produces,
              then say so in a sentence a warden can act on — which block, how sure, what to check
              first.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ 04 — limits ════════════════════════════════════════════════ */}
      <section className="editorial pt-24">
        <span className="eyebrow">04 / What this does not do</span>
        <div className="mt-8 grid gap-10 border-t border-ink pt-8 md:grid-cols-3">
          {LIMITS.map((x) => (
            <div key={x.t}>
              <h3 className="text-[15px] font-semibold text-ink">{x.t}</h3>
              <p className="mt-2.5 text-[13px] leading-[1.6] text-muted-ink">{x.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 05 — phone ═════════════════════════════════════════════════ */}
      <section className="editorial py-24">
        <div className="panel flex flex-wrap items-center justify-between gap-8 p-8">
          <div className="max-w-xl">
            <span className="eyebrow">05 / On a phone</span>
            <h2 className="mt-5 display text-[clamp(1.5rem,3vw,2.2rem)] text-ink">
              The student app
            </h2>
            <p className="mt-4 text-[14px] leading-[1.6] text-muted-ink">
              Scan to open the student view. Add it to the home screen, sign in as the demo student,
              file a report — and when a warden sends an advisory from the dashboard, it arrives on
              the lock screen.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/app">
                <NeuButton>Open student app</NeuButton>
              </Link>
              <Link href="/login">
                <NeuButton variant="ghost">Sign in</NeuButton>
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="border border-line-light bg-white p-3">
              <QRCodeSVG value="https://outbreak-radar-iota.vercel.app/login" size={128} />
            </div>
            <span className="meta">Scan to open /login</span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

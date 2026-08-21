/**
 * npm run detect:test
 *
 * Runs the real detection engine over every scenario and asserts the verdict
 * from a terminal, with no UI and no database involved.
 *
 * The two that matter most are `quiet` and `coincidence`. If either of those
 * raises an alert, the entire premise of the project is broken — those are the
 * cases the hackathon's Challenge Question is actually asking about.
 */

import { seedScenario } from '../lib/seed/scenarios';
import { detect } from '../lib/detect/engine';
import { fixtureFor, clusterDetailFixture } from '../lib/detect/fixture';
import { SCENARIOS, type DetectionResult, type ScenarioId } from '../lib/types';

const NOW = new Date('2026-08-22T09:00:00+05:30');

let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail = '') {
  checks++;
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!condition) failures++;
}

function cellFor(r: DetectionResult, nodeId: string) {
  for (const b of r.elevation.blocks)
    for (const f of b.floors) for (const c of f.filters) if (c.nodeId === nodeId) return c;
  return null;
}

console.log('\n═══ Outbreak Radar — detection engine ════════════════════════════');

for (const meta of SCENARIOS) {
  const id = meta.id as ScenarioId;
  const seeded = seedScenario(id, NOW);
  const r = detect(seeded.reports, id, NOW);
  const c = r.topCluster;

  console.log(`\n▸ ${meta.label.toUpperCase()}`);
  console.log(`  seed      ${seeded.note}`);
  console.log(`  data      ${seeded.reports.length} reports, ${r.totalCases} in the ${r.windowHours}h window`);
  console.log(`  headline  ${r.headline}`);
  if (c) {
    console.log(
      `  cluster   ${c.name} [${c.hypothesis}] status=${c.status} ` +
        `obs=${c.observed} exp=${c.expected} p=${c.pSpatial.toFixed(3)} q=${c.qValue}` +
        (c.relativeRisk ? ` RR=${c.relativeRisk}` : ''),
    );
  }
  console.log(
    `  naive     ${r.naiveThresholdWouldAlert ? `WOULD ALERT -> ${r.naiveThresholdNodeName}` : 'stays quiet'}`,
  );

  switch (id) {
    case 'quiet':
      check('reports no cluster at all', c === null);
      check('naive threshold also stays quiet', !r.naiveThresholdWouldAlert);
      break;

    case 'filter_fault':
      check('hypothesis is water', c?.hypothesis === 'water', c?.hypothesis);
      check('names Filter 3A in Block B', c?.nodeId === 'filter-B3A', c?.nodeId ?? 'none');
      check('significant', c?.significant === true);
      check('p below 0.01', (c?.pSpatial ?? 1) < 0.01, `p=${c?.pSpatial.toFixed(3)}`);
      check('escalated to alert', c?.status === 'alert', c?.status);
      check(
        'sibling filter 3B stays cold — this is what localises it',
        (cellFor(r, 'filter-B3B')?.caseCount ?? 99) < 3,
        `3B=${cellFor(r, 'filter-B3B')?.caseCount}`,
      );
      check(
        'meal confound is addressed rather than ignored',
        !!c?.alternative && /RR/.test(c.alternative),
      );
      break;

    case 'food':
      check('hypothesis is food, not water', c?.hypothesis === 'food', c?.hypothesis);
      check('relative risk above 4', (c?.relativeRisk ?? 0) > 4, `RR=${c?.relativeRisk}`);
      check('Fisher p below 0.01', (c?.pFood ?? 1) < 0.01, `p=${c?.pFood?.toExponential(1)}`);
      check('onset curve is sharp (under 14h)', (c?.curveWidthHours ?? 99) < 14, `${c?.curveWidthHours}h`);
      check(
        'day scholars are affected — this is what rules water out',
        r.elevation.dayScholars.caseCount > 0,
        `${r.elevation.dayScholars.caseCount} cases`,
      );
      check('no water node competes', (c?.pSpatial ?? 0) > 0.1, `spatial p=${c?.pSpatial.toFixed(2)}`);
      break;

    case 'coincidence':
      check('NOT significant', c?.significant === false, `p=${c?.pSpatial.toFixed(3)}`);
      check('held at watch — no advisory', c?.status === 'watch', c?.status);
      check('p well above 0.05', (c?.pSpatial ?? 0) > 0.05);
      check('a naive threshold system WOULD have alerted', r.naiveThresholdWouldAlert === true);
      check(
        'and we evaluated the SAME node it would have fired on',
        r.naiveThresholdNodeName === c?.name,
        `${r.naiveThresholdNodeName} vs ${c?.name}`,
      );
      break;
  }

  // shape contract the UI depends on
  check('elevation has 4 blocks', r.elevation.blocks.length === 4);
  check('every floor has exactly 2 filters', r.elevation.blocks.every((b) => b.floors.every((f) => f.filters.length === 2)));
  check('floors render top-down', r.elevation.blocks.every((b) => b.floors[0].label === 'Floor 5'));
  check('permutation ran 999 replicates', r.permutation?.replicates === 999);
  check('no cell leaks a count below 3', noSuppressionLeak(r));
}

function noSuppressionLeak(r: DetectionResult) {
  for (const b of r.elevation.blocks)
    for (const f of b.floors)
      for (const c of f.filters)
        if (c.caseCount > 0 && c.caseCount < 3 && !c.suppressed) return false;
  return true;
}

/* ---- the fixture must keep matching the contract the UI builds against ---- */
console.log('\n▸ FIXTURE CONTRACT');
for (const meta of SCENARIOS) {
  const f = fixtureFor(meta.id as ScenarioId);
  check(`${meta.id}: fixture has an elevation`, f.elevation.blocks.length === 4);
  if (f.topCluster) {
    check(`${meta.id}: cluster detail resolves`, clusterDetailFixture(meta.id as ScenarioId) !== null);
  }
}

console.log('\n══════════════════════════════════════════════════════════════════');
if (failures === 0) {
  console.log(`All ${checks} checks passed.\n`);
} else {
  console.log(`${failures} of ${checks} checks FAILED.\n`);
  process.exit(1);
}

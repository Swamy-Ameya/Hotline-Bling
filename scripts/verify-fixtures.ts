/**
 * npm run detect:test
 *
 * Runs every scenario and asserts the verdict from the terminal, with no UI
 * involved. Right now it checks the fixture; when the real engine lands it
 * points at that instead and the assertions do not change.
 *
 * The two that matter most are `quiet` and `coincidence`. If either of those
 * ever raises an alert, the whole premise of the project is broken — those are
 * the cases the Challenge Question is actually about.
 */

import { fixtureFor, clusterDetailFixture } from '../lib/detect/fixture';
import { SCENARIOS, type ScenarioId } from '../lib/types';

let failures = 0;

function check(label: string, condition: boolean, detail = '') {
  const mark = condition ? '  PASS' : '  FAIL';
  console.log(`${mark}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!condition) failures++;
}

function pct(n: number) {
  return `p=${n.toFixed(3)}`;
}

console.log('\n══ Outbreak Radar — detection verification ═══════════════════════\n');

for (const meta of SCENARIOS) {
  const id = meta.id as ScenarioId;
  const r = fixtureFor(id);

  console.log(`\n▸ ${meta.label.toUpperCase()}`);
  console.log(`  expected: ${meta.expected}`);
  console.log(`  headline: ${r.headline}`);
  const top = r.topCluster;
  if (top) {
    console.log(
      `  top:      ${top.name} — observed ${top.observed} vs expected ${top.expected}, ` +
        `LLR ${top.llr}, ${pct(top.pSpatial)}, q=${top.qValue}, status=${top.status}`,
    );
  } else {
    console.log('  top:      (none — system silent)');
  }
  console.log(
    `  naive threshold system would alert: ${r.naiveThresholdWouldAlert ? 'YES' : 'no'}` +
      (r.naiveThresholdNodeName ? ` -> ${r.naiveThresholdNodeName}` : ''),
  );

  switch (id) {
    case 'quiet':
      check('stays silent — no significant cluster', !r.clusters.some((c) => c.significant));
      check('no alert raised', !r.naiveThresholdWouldAlert);
      break;

    case 'filter_fault':
      check('localises to a water node', top?.hypothesis === 'water', top?.name);
      check('names Filter 3A in Block B', top?.nodeId === 'filter-B3A', top?.nodeId ?? 'none');
      check('statistically significant', top?.significant === true, pct(top?.pSpatial ?? 1));
      check('p below 0.01', (top?.pSpatial ?? 1) < 0.01);
      check('sibling filter 3B stays cold', siblingIsCold(r, 'filter-B3B'));
      break;

    case 'food':
      check('localises to food, not water', top?.hypothesis === 'food', top?.hypothesis);
      check('relative risk above 4', (top?.relativeRisk ?? 0) > 4, `RR=${top?.relativeRisk}`);
      check('sharp onset curve (under 12h wide)', (top?.curveWidthHours ?? 99) < 12);
      check('day scholars affected — rules water out', r.elevation.dayScholars.caseCount > 0);
      break;

    case 'coincidence':
      check('NOT significant', top?.significant === false, pct(top?.pSpatial ?? 0));
      check('held at watch, never alert', top?.status === 'watch', top?.status);
      check('p above 0.05', (top?.pSpatial ?? 0) > 0.05);
      check(
        'a naive threshold system WOULD have alerted (this is the contrast)',
        r.naiveThresholdWouldAlert === true,
      );
      break;
  }

  // shape checks that the UI depends on
  check('elevation has 4 blocks', r.elevation.blocks.length === 4);
  check('every floor has exactly 2 filters', r.elevation.blocks.every((b) => b.floors.every((f) => f.filters.length === 2)));
  check('floors render top-down', r.elevation.blocks.every((b) => b.floors[0].label === 'Floor 5'));
  check('permutation has 999 replicates', r.permutation?.replicates === 999);
  check(
    'permutation p matches cluster p',
    !top || Math.abs((r.permutation?.pValue ?? -1) - top.pSpatial) < 1e-9,
  );

  const detail = clusterDetailFixture(id);
  if (top) {
    check('cluster detail resolves', detail !== null);
    check('detail carries cases', (detail?.cases.length ?? 0) > 0, `${detail?.cases.length} cases`);
  }
}

function siblingIsCold(r: ReturnType<typeof fixtureFor>, nodeId: string) {
  for (const b of r.elevation.blocks)
    for (const f of b.floors)
      for (const c of f.filters) if (c.nodeId === nodeId) return c.caseCount < 3;
  return false;
}

console.log('\n══════════════════════════════════════════════════════════════════');
if (failures === 0) {
  console.log('All checks passed.\n');
} else {
  console.log(`${failures} check(s) FAILED.\n`);
  process.exit(1);
}

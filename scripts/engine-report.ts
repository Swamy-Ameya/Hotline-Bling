/** Scratch harness: run the real engine over every scenario and dump what it found. */

import { seedScenario } from '../lib/seed/scenarios';
import { detect } from '../lib/detect/engine';
import { SCENARIOS } from '../lib/types';

const NOW = new Date('2026-08-22T09:00:00+05:30');

for (const meta of SCENARIOS) {
  const seeded = seedScenario(meta.id, NOW);
  const r = detect(seeded.reports, meta.id, NOW);
  const c = r.topCluster;

  console.log(`\n────────── ${meta.label.toUpperCase()}`);
  console.log(`seed note : ${seeded.note}`);
  console.log(`reports   : ${seeded.reports.length} total, ${r.totalCases} in ${r.windowHours}h window`);
  console.log(`baseline  : ${r.baselineRatePerDay}/student/day`);
  console.log(`expected  : ${meta.expected}`);
  if (c) {
    console.log(
      `FOUND     : ${c.name} [${c.hypothesis}] status=${c.status} significant=${c.significant}`,
    );
    console.log(
      `            obs=${c.observed} exp=${c.expected} LLR=${c.llr} p=${c.pSpatial.toFixed(3)} q=${c.qValue}`,
    );
    console.log(
      `            RR=${c.relativeRisk} incub=${c.medianIncubationHours}h width=${c.curveWidthHours}h`,
    );
    console.log(`verdict   : ${c.verdict}`);
    console.log(`alt       : ${c.alternative}`);
  } else {
    console.log('FOUND     : (nothing)');
  }
  console.log(
    `naive     : ${r.naiveThresholdWouldAlert ? 'WOULD ALERT -> ' + r.naiveThresholdNodeName : 'no alert'}`,
  );
  console.log(`headline  : ${r.headline}`);
  console.log(`dayschol  : ${r.elevation.dayScholars.caseCount} cases`);
}
console.log();

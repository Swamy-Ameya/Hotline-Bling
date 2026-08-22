/** npm run situation — print the current campus picture from the database. */

import { buildSituationReport } from '../lib/domain/surveillance';
import { countStudents, getRecentMeals } from '../lib/db';

const r = buildSituationReport();

console.log('\n═══ CAMPUS SITUATION ═════════════════════════════════════════════\n');
console.log(`Overall        : ${r.overall.toUpperCase()}`);
console.log(`Headline       : ${r.headline}`);
console.log(`Students       : ${countStudents().toLocaleString()} monitored`);
console.log(`Cases (72h)    : ${r.totalCases}  (${r.doctorConfirmed} seen by a doctor, ${r.selfReported} self-reported)`);
console.log(`Day scholars   : ${r.dayScholarCases}`);
console.log(`Meals on record: ${getRecentMeals(96).length} in the last 4 days`);

console.log(`\n── Hotspots (${r.hotspots.length}) ──`);
for (const h of r.hotspots) {
  console.log(`\n  ${h.label}  [${h.level}]  ${h.confidence} confidence`);
  console.log(`    ${h.comparison}`);
  console.log(`    ${h.summary}`);
  console.log(`    Likely source : ${h.source}`);
  console.log(`    Do first      : ${h.recommendedAction}`);
}

console.log(`\n── Suspect meals (${r.suspectMeals.length}) ──`);
for (const m of r.suspectMeals) {
  console.log(`  ${m.label}`);
  console.log(`    ${m.phrase}`);
  console.log(`    Menu: ${m.menuItems.join(', ')}`);
}

console.log(`\n── Failing water tests (${r.failingWaterSources.length}) ──`);
for (const w of r.failingWaterSources) {
  console.log(`  ${w.name} — ${w.notes ?? 'failed'}`);
}

console.log(`\n── Recent cases (first 5 of ${r.recentCases.length}) ──`);
for (const c of r.recentCases.slice(0, 5)) {
  const where = c.blockName ? `${c.blockName} F${c.floor} R${c.room}` : 'Day scholar';
  console.log(`  ${c.origin.padEnd(6)} ${where.padEnd(18)} ${c.symptoms.join(', ')}`);
}
console.log();

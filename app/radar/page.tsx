import { buildSituationReport } from '@/lib/domain/surveillance';
import { buildMapBlocks } from '@/lib/domain/campus-view';
import { buildDispatchPlan, type DispatchPlan } from '@/lib/domain/dispatch';
import { AppShell } from '@/components/neu/shell';
import { RadarClient } from './radar-client';

export const dynamic = 'force-dynamic';

export default async function RadarPage() {
  const report = buildSituationReport();
  const blocks = buildMapBlocks();

  // Dispatch plans are worked out here rather than on selection, because the
  // recipient count needs the roster and the meal scans — and a warden should
  // never watch a spinner between "this block is in trouble" and "here is who
  // gets told".
  const plans: Record<string, DispatchPlan> = {};
  for (const h of report.hotspots) {
    const plan = buildDispatchPlan(h, report.suspectMeals);
    if (plan) plans[h.blockId] = plan;
  }

  return (
    <AppShell>
      <RadarClient report={report} blocks={blocks} plans={plans} />
    </AppShell>
  );
}

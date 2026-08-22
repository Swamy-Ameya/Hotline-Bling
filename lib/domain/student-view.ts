/**
 * ============================================================================
 *  STUDENT VIEW BUILDER
 * ============================================================================
 *  A student must NEVER see campus case counts, doctor-confirmed vs self-reported
 *  splits, other students' records, or suspect-meal analyses.
 *
 *  This builder sanitises everything before it leaves the server:
 *  - Campus view contains RiskLevel ONLY.
 *  - Pool heat is visible only AFTER the student has filed a report.
 *  - Advisories are scoped to their cohort.
 * ============================================================================
 */

import { BLOCKS, blockById } from '@/lib/domain/campus';
import { getStudent, getStudentNotifications, getStudentSelfReports, getCases } from '@/lib/db';
import { buildSituationReport } from '@/lib/domain/surveillance';
import type { NotificationRow, PoolId, Symptom } from '@/lib/db/types';
import type { RiskLevel } from '@/lib/domain/risk';

export interface StudentView {
  student: {
    id: string;
    name: string;
    registration: string;
    blockId: string | null;
    blockName: string | null;
    floor: number | null;
    room: string | null;
  };
  myBlock: { name: string; level: RiskLevel } | null;
  /** Campus-wide risk overview — LEVEL ONLY, NO NUMBERS */
  campus: { blockId: string; name: string; level: RiskLevel }[];
  myPool: PoolId | null;
  /** Sickness pool heat spread — null until student reports */
  poolHeat: { blockId: string; name: string; level: RiskLevel }[] | null;
  advisories: NotificationRow[];
  myReports: {
    id: string;
    reportedAt: string;
    pool: PoolId;
    symptoms: Symptom[];
    severity: number;
  }[];
}

export function buildStudentView(studentId: string): StudentView | null {
  const student = getStudent(studentId);
  if (!student) return null;

  const sitReport = buildSituationReport();
  const blockName = student.blockId ? (blockById(student.blockId)?.name ?? null) : null;

  // General campus risk levels only — strip all numbers
  const campus = BLOCKS.map((b) => {
    const hot = sitReport.hotspots.find((h) => h.blockId === b.id);
    return {
      blockId: b.id,
      name: b.name,
      level: hot?.level ?? ('normal' as RiskLevel),
    };
  });

  const myBlockHot = student.blockId
    ? sitReport.hotspots.find((h) => h.blockId === student.blockId)
    : null;

  const myBlock = blockName
    ? { name: blockName, level: myBlockHot?.level ?? ('normal' as RiskLevel) }
    : null;

  // Student's reports
  const rawReports = getStudentSelfReports(studentId);
  const myReports = rawReports.map((r) => ({
    id: r.id,
    reportedAt: r.reportedAt,
    pool: r.pool ?? 'gastro',
    symptoms: r.symptoms,
    severity: r.severity,
  }));

  // Latest pool
  const latestReport = myReports[0];
  const myPool = latestReport?.pool ?? null;

  // Pool heat across campus (only if student reported)
  let poolHeat: { blockId: string; name: string; level: RiskLevel }[] | null = null;
  if (myPool) {
    const allCases = getCases(72);
    const poolCases = allCases.filter((c) => (c.pool ?? 'gastro') === myPool);

    poolHeat = BLOCKS.map((b) => {
      const bCases = poolCases.filter((c) => c.blockName === b.name).length;
      let level: RiskLevel = 'normal';
      if (bCases >= 8) level = 'critical';
      else if (bCases >= 4) level = 'elevated';
      else if (bCases >= 2) level = 'watch';

      return {
        blockId: b.id,
        name: b.name,
        level,
      };
    });
  }

  const advisories = getStudentNotifications(studentId);

  return {
    student: {
      id: student.id,
      name: student.name,
      registration: student.registration,
      blockId: student.blockId,
      blockName,
      floor: student.floor,
      room: student.room,
    },
    myBlock,
    campus,
    myPool,
    poolHeat,
    advisories,
    myReports,
  };
}

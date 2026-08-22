/**
 * Report Weighting
 *
 * Doctor: 1.0 (clinician examined the patient)
 * Self: 0.4 (student self-reported via mobile form)
 *
 * Four self-reports carry roughly the weight of one examined case,
 * preventing unverified rumours or anxiety from tripping false alarms.
 */

export const WEIGHT = {
  doctor: 1.0,
  self: 0.4,
} as const;

export type ReportOrigin = keyof typeof WEIGHT;

/**
 * Registration numbers — 250205xxxx
 *
 * 2 5 0 2 0 5 X X X X
 * │ │ │ │ │ │ └─┴─┴─┴─ 4-digit serial, 0001–9999
 * │ │ │ │ └─┴───────── programme code (05 = B.Tech CSE, 06 = IT, 10 = Mech, 15 = ECE)
 * │ │ └─┴───────────── school code (02 = School of Computing)
 * └─┴───────────────── admission year (25 = 2025)
 */

export function makeRegistration(serial: number, programme = '0205'): string {
  const serialStr = String(serial).padStart(4, '0');
  return `25${programme}${serialStr}`;
}

export function parseRegistration(reg: string): {
  year: number;
  school: string;
  programme: string;
  serial: number;
} | null {
  const clean = reg.trim();
  if (!isValidRegistration(clean)) return null;

  return {
    year: parseInt(clean.slice(0, 2), 10),
    school: clean.slice(2, 4),
    programme: clean.slice(4, 6),
    serial: parseInt(clean.slice(6, 10), 10),
  };
}

export function isValidRegistration(reg: string): boolean {
  return /^25\d{8}$/.test(reg.trim());
}

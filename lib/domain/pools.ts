/**
 * Sickness pools classification
 *
 * Classifies reported symptoms into pools so students only see spread of
 * their own kind of illness, never campus-wide case books.
 */

import type { PoolId, Symptom } from '@/lib/db/types';

export interface PoolConfig {
  id: PoolId;
  label: string;
  blurb: string;
  symptoms: Symptom[];
  colour: string;
}

export const POOLS: Record<PoolId, PoolConfig> = {
  gastro: {
    id: 'gastro',
    label: 'Stomach illness',
    blurb: 'Vomiting, loose motions, stomach pain, nausea, dehydration',
    symptoms: ['vomiting', 'loose_motions', 'stomach_pain', 'nausea', 'dehydration'],
    colour: 'orange',
  },
  respiratory: {
    id: 'respiratory',
    label: 'Respiratory infection',
    blurb: 'Cough, sore throat, runny nose, breathlessness',
    symptoms: ['cough', 'sore_throat', 'runny_nose', 'breathlessness'],
    colour: 'blue',
  },
  fever: {
    id: 'fever',
    label: 'Fever & viral illness',
    blurb: 'Fever, body ache, headache, weakness',
    symptoms: ['fever', 'body_ache', 'headache', 'weakness'],
    colour: 'red',
  },
  skin: {
    id: 'skin',
    label: 'Skin condition',
    blurb: 'Skin rash, itching',
    symptoms: ['rash', 'itching'],
    colour: 'purple',
  },
  other: {
    id: 'other',
    label: 'General / other',
    blurb: 'Other miscellaneous symptoms',
    symptoms: [],
    colour: 'slate',
  },
};

/**
 * Returns the pool with the highest symptom overlap.
 * Defaults to 'other' if no symptoms match or on empty input.
 */
export function poolFor(symptoms: Symptom[]): PoolId {
  if (!symptoms || symptoms.length === 0) return 'other';

  const poolKeys: (Exclude<PoolId, 'other'>)[] = ['gastro', 'respiratory', 'fever', 'skin'];
  let bestPool: PoolId = 'other';
  let maxOverlap = 0;

  for (const key of poolKeys) {
    const targetSet = new Set(POOLS[key].symptoms);
    let count = 0;
    for (const s of symptoms) {
      if (targetSet.has(s)) count++;
    }
    if (count > maxOverlap) {
      maxOverlap = count;
      bestPool = key;
    }
  }

  return bestPool;
}

export type { PoolId };

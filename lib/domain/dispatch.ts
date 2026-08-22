/**
 * ============================================================================
 *  DISPATCH — who gets told, and who deliberately does not
 * ============================================================================
 *  The failure mode of every campus health alert is that it goes to everyone.
 *  Four thousand students get a message about a tank they do not drink from,
 *  two mess halls shut for a problem in neither of them, and the next advisory
 *  is ignored because the last one was noise.
 *
 *  So an advisory here is addressed, not broadcast. The route depends on what
 *  the assessment blames:
 *
 *    WATER  the cluster sits inside one block. We name the line — block, tank,
 *           and the floors actually reporting — send maintenance to that line,
 *           and advise only the students living on those floors to use another
 *           drinking point until it is tested.
 *
 *    FOOD   the cluster crosses blocks and shares a sitting. Meal attendance
 *           is already a card scan, so we can address exactly the students who
 *           ate that meal and leave every other diner alone.
 *
 *  The recipient count is computed before anything is sent and shown to the
 *  person pressing the button. Being able to see "112 students, not 4,000" is
 *  what makes a warden willing to press it at all.
 * ============================================================================
 */

import { blockById, blockCapacity, floorCapacity, messForBlock } from '@/lib/domain/campus';
import type { Hotspot, MealSuspicion } from '@/lib/domain/surveillance';
import { getCases, getMealAttendees, countStudents } from '@/lib/db';

export type DispatchRoute = 'water' | 'food' | 'unclear';

export interface DispatchPlan {
  route: DispatchRoute;
  blockId: string;
  blockName: string;

  /** Floors actually reporting. Empty means the whole block. */
  floors: number[];
  /** Plain-English address of the thing to go and look at. */
  supplyLine: string;

  /** Present on the food route only. */
  meal?: {
    id: string;
    label: string;
    servedAt: string;
    menuItems: string[];
    /** How many students scanned into this sitting. */
    attendees: number;
  };

  /** Exactly how many students receive the advisory. */
  recipients: number;
  /** How many would receive it if this were a campus broadcast. */
  campusPopulation: number;

  /** The work order that goes out alongside the advisory. */
  maintenance: { team: string; target: string; instruction: string };

  advisoryTitle: string;
  advisoryBody: string;

  /** What the API needs to address the send. */
  target: {
    blockId: string | null;
    floor: number | null;
    floors: number[] | null;
    mealId: string | null;
  };
}

function floorsReporting(blockName: string, windowHours = 72): number[] {
  const cases = getCases(windowHours).filter((c) => c.blockName === blockName && c.floor);
  return [...new Set(cases.map((c) => c.floor as number))].sort((a, b) => a - b);
}

function listFloors(floors: number[], totalFloors: number): string {
  // Once every floor is reporting, naming them one by one is both clumsy and
  // misleading — it implies a targeting precision the evidence does not have.
  // Every floor drinking from the same tank IS the block.
  if (floors.length === 0 || floors.length >= totalFloors) return 'every floor';
  if (floors.length === 1) return `floor ${floors[0]}`;
  const head = floors.slice(0, -1).join(', ');
  return `floors ${head} and ${floors[floors.length - 1]}`;
}

export function buildDispatchPlan(
  hotspot: Hotspot,
  suspectMeals: MealSuspicion[],
): DispatchPlan | null {
  const block = blockById(hotspot.blockId);
  if (!block) return null;

  const campusPopulation = countStudents();
  const floors = floorsReporting(hotspot.blockName);

  const foodRoute = hotspot.source === 'mess_food';
  const waterRoute = hotspot.source === 'block_water' || hotspot.source === 'campus_water';

  /* ------------------------------------------------------------ food --- */
  if (foodRoute && suspectMeals.length > 0) {
    const meal = suspectMeals[0];
    const attendees = getMealAttendees(meal.mealId);
    const mess = messForBlock(block.id);

    return {
      route: 'food',
      blockId: block.id,
      blockName: block.name,
      floors,
      supplyLine: `${mess?.name ?? 'Mess'} · ${meal.label}`,
      meal: {
        id: meal.mealId,
        label: meal.label,
        servedAt: meal.servedAt,
        menuItems: meal.menuItems,
        attendees: attendees.size,
      },
      // Everyone who scanned into that sitting, and nobody else. Students in
      // the same block who ate elsewhere are not at risk from this meal and do
      // not need a message about it.
      recipients: attendees.size,
      campusPopulation,
      maintenance: {
        team: 'Mess supervisor',
        target: `${mess?.name ?? 'Mess'} — ${meal.label}`,
        instruction: `Pull the batch and preparation log for this sitting (${meal.menuItems.join(', ')}). Retain samples. Do not close the other mess — nothing implicates it.`,
      },
      advisoryTitle: `Health advisory — ${meal.label}`,
      advisoryBody:
        `You are receiving this because your card was scanned at ${meal.label}. ` +
        `Several students who ate this meal have reported stomach illness. ` +
        `Please watch for nausea, vomiting, loose motions or fever over the next 24 hours, ` +
        `keep taking fluids, and visit the campus health centre if symptoms start. ` +
        `No other meal or mess is affected.`,
      target: { blockId: null, floor: null, floors: null, mealId: meal.mealId },
    };
  }

  /* ----------------------------------------------------------- water --- */
  if (waterRoute || floors.length > 0) {
    const perFloor = floorCapacity(block);
    const wholeBlock = floors.length === 0 || floors.length >= block.floors;
    const recipients = wholeBlock ? blockCapacity(block) : perFloor * floors.length;
    const campusWide = hotspot.source === 'campus_water';
    const where = listFloors(floors, block.floors);
    // Addressing every floor separately and addressing the block are the same
    // set of people; say the simpler of the two.
    const audienceFloors = wholeBlock ? [] : floors;

    return {
      route: 'water',
      blockId: block.id,
      blockName: block.name,
      floors,
      supplyLine: campusWide
        ? 'Central RO plant → all block tanks'
        : `Block ${block.name} overhead tank → ${where}`,
      recipients,
      campusPopulation,
      maintenance: {
        team: campusWide ? 'Central plant engineer' : 'Hostel maintenance',
        target: campusWide
          ? 'Central RO plant'
          : `Block ${block.name} overhead tank and the ${where} drinking line`,
        instruction: campusWide
          ? 'More than one block is affected, so the fault is upstream of the tanks. Test plant output and the distribution header before touching individual tanks.'
          : `Test the tank for coliform and residual chlorine, check when it was last cleaned, and flush the ${where} line. Report back before the advisory is lifted.`,
      },
      advisoryTitle: wholeBlock
        ? `Health advisory — Block ${block.name}`
        : `Health advisory — Block ${block.name}, ${where}`,
      advisoryBody: wholeBlock
        ? `You are receiving this because you live in Block ${block.name}. ` +
          `We have seen a rise in stomach illness across the block and the tank serving it is being tested. ` +
          `Until we confirm it is clear, please use the RO point in the mess block or bottled water for drinking and brushing. ` +
          `If you feel unwell, report it in the app or visit the health centre. ` +
          `Other blocks are unaffected.`
        : `You are receiving this because you live on ${where} of Block ${block.name}. ` +
          `We have seen a rise in stomach illness on your floor and the water line serving it is being tested. ` +
          `Until we confirm it is clear, please use the RO point in the mess block or bottled water for drinking and brushing. ` +
          `If you feel unwell, report it in the app or visit the health centre. ` +
          `Other floors and other blocks are unaffected.`,
      target: {
        blockId: block.id,
        floor: audienceFloors.length === 1 ? audienceFloors[0] : null,
        floors: audienceFloors.length > 1 ? audienceFloors : null,
        mealId: null,
      },
    };
  }

  /* --------------------------------------------------------- unclear --- */
  return {
    route: 'unclear',
    blockId: block.id,
    blockName: block.name,
    floors,
    supplyLine: `Block ${block.name} — source not established`,
    recipients: blockCapacity(block),
    campusPopulation,
    maintenance: {
      team: 'Hostel warden',
      target: `Block ${block.name}`,
      instruction:
        'Not enough information to name a source yet. Follow up on new reports before sending anything wider than this block.',
    },
    advisoryTitle: `Health notice — Block ${block.name}`,
    advisoryBody:
      `A few more students than usual in your block have reported stomach illness. ` +
      `Nothing is confirmed and no source has been identified. ` +
      `If you feel unwell, please report it in the app so we can see the picture properly.`,
    target: { blockId: block.id, floor: null, floors: null, mealId: null },
  };
}

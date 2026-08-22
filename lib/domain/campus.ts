/**
 * ============================================================================
 *  CAMPUS — Manipal University Jaipur, as it actually is
 * ============================================================================
 *  Deliberately realistic. Earlier versions of this project modelled water down
 *  to individual per-floor filter cartridges, which sounded impressive and was
 *  fiction — no hostel in India tracks which cartridge served which room, and
 *  no warden could act on that even if we produced it.
 *
 *  What a hostel actually knows:
 *    - which block a student lives in
 *    - which floor, and which room
 *    - which overhead tank feeds that block
 *    - which mess they eat at, and roughly when
 *
 *  That is the resolution we model, and it is enough. "Block B4, second floor"
 *  is an address maintenance can walk to. "Filter 3A" was never real.
 * ============================================================================
 */

export type BlockGender = 'boys' | 'girls';

export interface Block {
  id: string;
  /** B1..B12 for boys, G1..G7 for girls — the names students actually use. */
  name: string;
  gender: BlockGender;
  floors: number;
  roomsPerFloor: number;
  studentsPerRoom: number;
  /** Overhead tank serving this block. Blocks never share a tank. */
  tankId: string;
  /** Approximate campus position, for the map. */
  lat: number;
  lng: number;
}

export interface WaterSource {
  id: string;
  name: string;
  /** 'plant' feeds tanks; 'tank' feeds one block. */
  kind: 'plant' | 'tank';
  parentId: string | null;
  lat?: number;
  lng?: number;
}

export interface Mess {
  id: string;
  name: string;
  /** Blocks whose students normally eat here. */
  servesBlockIds: string[];
  lat: number;
  lng: number;
}

/* ---------------------------------------------------------------- water --- */

export const RO_PLANT: WaterSource = {
  id: 'ro-plant',
  name: 'Central RO Plant',
  kind: 'plant',
  parentId: null,
  lat: 26.8434,
  lng: 75.5652,
};

/* --------------------------------------------------------------- blocks --- */

const BOYS_COORDS: [number, number][] = [
  [26.8428, 75.5641], [26.8431, 75.5646], [26.8434, 75.5650], [26.8437, 75.5654],
  [26.8425, 75.5644], [26.8428, 75.5649], [26.8431, 75.5653], [26.8434, 75.5658],
  [26.8422, 75.5647], [26.8425, 75.5652], [26.8428, 75.5656], [26.8431, 75.5661],
];

const GIRLS_COORDS: [number, number][] = [
  [26.8442, 75.5638], [26.8445, 75.5643], [26.8448, 75.5647],
  [26.8440, 75.5642], [26.8443, 75.5647], [26.8446, 75.5651], [26.8438, 75.5645],
];

function buildBlocks(): Block[] {
  const blocks: Block[] = [];

  BOYS_COORDS.forEach(([lat, lng], i) => {
    const n = i + 1;
    blocks.push({
      id: `block-B${n}`,
      name: `B${n}`,
      gender: 'boys',
      floors: 4,
      roomsPerFloor: 30,
      studentsPerRoom: 2,
      tankId: `tank-B${n}`,
      lat,
      lng,
    });
  });

  GIRLS_COORDS.forEach(([lat, lng], i) => {
    const n = i + 1;
    blocks.push({
      id: `block-G${n}`,
      name: `G${n}`,
      gender: 'girls',
      floors: 4,
      roomsPerFloor: 28,
      studentsPerRoom: 2,
      tankId: `tank-G${n}`,
      lat,
      lng,
    });
  });

  return blocks;
}

export const BLOCKS: Block[] = buildBlocks();

export const TANKS: WaterSource[] = BLOCKS.map((b) => ({
  id: b.tankId,
  name: `${b.name} overhead tank`,
  kind: 'tank' as const,
  parentId: RO_PLANT.id,
  lat: b.lat,
  lng: b.lng,
}));

export const WATER_SOURCES: WaterSource[] = [RO_PLANT, ...TANKS];

/* ----------------------------------------------------------------- mess --- */

export const MESSES: Mess[] = [
  {
    id: 'mess-blue-dove',
    name: 'Blue Dove Mess',
    servesBlockIds: BLOCKS.filter((b) => b.gender === 'boys').map((b) => b.id),
    lat: 26.8430,
    lng: 75.5648,
  },
  {
    id: 'mess-aravali',
    name: 'Aravali Mess',
    servesBlockIds: BLOCKS.filter((b) => b.gender === 'girls').map((b) => b.id),
    lat: 26.8444,
    lng: 75.5645,
  },
];

/* ------------------------------------------------------------- helpers ---- */

export function blockById(id: string): Block | undefined {
  return BLOCKS.find((b) => b.id === id);
}

export function blockByName(name: string): Block | undefined {
  return BLOCKS.find((b) => b.name.toLowerCase() === name.toLowerCase());
}

export function messForBlock(blockId: string): Mess | undefined {
  return MESSES.find((m) => m.servesBlockIds.includes(blockId));
}

export function blockCapacity(b: Block): number {
  return b.floors * b.roomsPerFloor * b.studentsPerRoom;
}

export function floorCapacity(b: Block): number {
  return b.roomsPerFloor * b.studentsPerRoom;
}

export const TOTAL_CAPACITY = BLOCKS.reduce((s, b) => s + blockCapacity(b), 0);

/** Every floor on campus, as a flat list — the finest level we localise to. */
export interface FloorRef {
  id: string;
  blockId: string;
  blockName: string;
  floor: number;
  label: string;
  capacity: number;
}

export const FLOORS: FloorRef[] = BLOCKS.flatMap((b) =>
  Array.from({ length: b.floors }, (_, i) => {
    const floor = i + 1;
    return {
      id: `${b.id}-f${floor}`,
      blockId: b.id,
      blockName: b.name,
      floor,
      label: `${b.name} · Floor ${floor}`,
      capacity: floorCapacity(b),
    };
  }),
);

export function roomNumber(floor: number, index: number): string {
  return `${floor}${String(index + 1).padStart(2, '0')}`;
}

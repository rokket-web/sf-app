// Maps a position (1-60) on TTI's DISC wheel to one of the eight OXYGEN compass points.
// Derived from the wheel graph's layout: each position's angle around the wheel, snapped to the nearest 45 degrees.
// Checked against a real report: natural 60 -> accurate, adapted 3 -> relational (matches the PDF).
export const COMPASS_POINTS = [
  { key: "efficient", dir: "N", label: "Efficient Partner" },
  { key: "driven", dir: "NE", label: "Driven Partner" },
  { key: "persuasive", dir: "E", label: "Persuasive Partner" },
  { key: "relational", dir: "SE", label: "Relational Partner" },
  { key: "peacekeeping", dir: "S", label: "Peace Keeping Partner" },
  { key: "steady", dir: "SW", label: "Steady Partner" },
  { key: "coordinating", dir: "W", label: "Coordinating Partner" },
  { key: "accurate", dir: "NW", label: "Accurate Partner" },
] as const;

export type CompassKey = (typeof COMPASS_POINTS)[number]["key"];

const DIR_BY_POS: Record<number, string> = {
  1: "NE", 2: "E", 3: "SE", 4: "S", 5: "SW", 6: "W", 7: "NW", 8: "N", 9: "N", 10: "NE", 11: "NE", 12: "E", 13: "E",
  14: "SE", 15: "SE", 16: "S", 17: "S", 18: "SW", 19: "SW", 20: "W", 21: "W", 22: "NW", 23: "NW", 24: "N", 25: "N",
  26: "NE", 27: "NE", 28: "E", 29: "E", 30: "SE", 31: "SE", 32: "S", 33: "S", 34: "SW", 35: "SW", 36: "W", 37: "W",
  38: "NW", 39: "NW", 40: "N", 41: "N", 42: "NE", 43: "NE", 44: "E", 45: "E", 46: "SE", 47: "SE", 48: "S", 49: "S",
  50: "SW", 51: "SW", 52: "W", 53: "W", 54: "NW", 55: "NW", 56: "N", 57: "NE", 58: "SE", 59: "SW", 60: "NW",
};

export function compassPoint(pos: number | undefined) {
  const dir = pos ? DIR_BY_POS[pos] : undefined;
  return COMPASS_POINTS.find((p) => p.dir === dir);
}

// Compass point -> the type name used by the Get Advice conversation language (src/lib/brief).
const SECTOR_BY_KEY = {
  efficient: "Efficient",
  driven: "Driven",
  persuasive: "Persuasive",
  relational: "Relational",
  peacekeeping: "Peace Keeping",
  steady: "Steady",
  coordinating: "Coordinating",
  accurate: "Accurate",
} as const satisfies Record<CompassKey, string>;

export function sectorForPosition(pos: number | undefined) {
  const point = compassPoint(pos);
  return point ? SECTOR_BY_KEY[point.key] : null;
}

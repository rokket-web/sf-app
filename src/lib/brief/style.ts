import type { DiscScores } from "@/lib/assessment/types";

// OXYGEN compass geometry, derived from DISC scores. This is our own mapping, not a TTI score:
//   x (pace)        + faster  = D + I,  - slower   = S + C
//   y (orientation) + task    = D + C,  - people   = I + S
// so D=Driven (task, fast), I=Relational (people, fast), S=Steady (people, slow), C=Accurate (task, slow).

export const SECTORS = ["Efficient", "Driven", "Persuasive", "Relational", "Peace Keeping", "Steady", "Coordinating", "Accurate"] as const;
export type Sector = (typeof SECTORS)[number];
export type StyleKey = Sector | "Balanced";

// DISC factors run 0-100. Dividing by 150 (not 200) spreads typical profiles away from the centre.
const SPAN = 150;
const clamp = (n: number) => Math.max(-1, Math.min(1, n));

export type Axes = { x: number; y: number };

export function axes(s: DiscScores): Axes {
  return {
    x: clamp((s.d + s.i - (s.s + s.c)) / SPAN),
    y: clamp((s.d + s.c - (s.i + s.s)) / SPAN),
  };
}

export function sectorOf({ x, y }: Axes): StyleKey {
  if (Math.hypot(x, y) < 0.08) return "Balanced";
  const bearing = (Math.atan2(x, y) * 180) / Math.PI; // clockwise from "up"
  return SECTORS[Math.round((bearing + 360) % 360 / 45) % 8];
}

// 0 = slowest, 100 = fastest.
export const paceScore = ({ x }: Axes) => Math.round((x + 1) * 50);

export type StyleProfile = {
  axes: Axes;
  sector: StyleKey;
  orientation: "Task-oriented" | "People-oriented";
  pace: "Faster" | "Slower";
  paceScore: number;
};

export function styleProfile(scores: DiscScores): StyleProfile {
  const a = axes(scores);
  return {
    axes: a,
    sector: sectorOf(a),
    orientation: a.y >= 0 ? "Task-oriented" : "People-oriented",
    pace: a.x >= 0 ? "Faster" : "Slower",
    paceScore: paceScore(a),
  };
}

export type PairingKind = "same-focus-different-pace" | "same-pace-different-focus" | "different-both" | "similar";

export function pairing(a: StyleProfile, b: StyleProfile): PairingKind {
  const sameFocus = a.orientation === b.orientation;
  const closePace = Math.abs(a.paceScore - b.paceScore) < 15;
  if (sameFocus && closePace) return "similar";
  if (sameFocus) return "same-focus-different-pace";
  if (a.pace === b.pace || closePace) return "same-pace-different-focus";
  return "different-both";
}

const FACTOR_LABEL = { d: "Dominance", i: "Influence", s: "Steadiness", c: "Compliance" } as const;
export type Factor = keyof typeof FACTOR_LABEL;

export type AdaptationLoad = {
  level: "low" | "moderate" | "high";
  direction: "slower" | "faster" | "mixed";
  naturalPace: number;
  currentPace: number;
  factors: { key: Factor; label: string; natural: number; current: number; delta: number }[];
};

// How far someone's current (adapted) style sits from their own natural style.
// The thresholds are a first pass, worth tuning once we see real spreads.
export function adaptationLoad(natural: DiscScores, adapted: DiscScores): AdaptationLoad {
  const factors = (Object.keys(FACTOR_LABEL) as Factor[]).map((key) => ({
    key,
    label: FACTOR_LABEL[key],
    natural: natural[key],
    current: adapted[key],
    delta: adapted[key] - natural[key],
  }));
  const meanShift = factors.reduce((sum, f) => sum + Math.abs(f.delta), 0) / factors.length;
  const naturalPace = paceScore(axes(natural));
  const currentPace = paceScore(axes(adapted));
  const paceShift = currentPace - naturalPace;
  return {
    level: meanShift < 8 ? "low" : meanShift < 16 ? "moderate" : "high",
    direction: paceShift <= -10 ? "slower" : paceShift >= 10 ? "faster" : "mixed",
    naturalPace,
    currentPace,
    factors,
  };
}

import type { AdaptationLoad, PairingKind } from "./style";

// Profile, pairing and conversation language now lives in ./advice.ts (Get Advice database).
// What remains here is the short app-written copy for the computed pace gap and adaptation load.

export const PACE_SUMMARY: Record<PairingKind, string> = {
  "same-focus-different-pace": "You share a focus. The gap is pace, not direction.",
  "same-pace-different-focus": "You move at a similar pace. The gap is task versus people.",
  "different-both": "You differ on both pace and focus.",
  similar: "You are close on both pace and focus.",
};

export function adaptationCopy(load: AdaptationLoad) {
  if (load.level === "low") {
    return "Their current style is close to their natural one, so they are likely working the way that comes easily right now.";
  }
  const how =
    load.direction === "slower"
      ? "pulling back from their natural pace"
      : load.direction === "faster"
        ? "pushing harder than their natural pace"
        : "adjusting their style in several directions";
  return load.level === "high"
    ? `A large shift like this, ${how}, can mean they are under more strain than usual. Worth a lower-key approach today, not just a faster one.`
    : `They are ${how}. Modest strain is normal, so check in rather than assume.`;
}

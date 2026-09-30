import type { AdaptationLoad, PairingKind, StyleKey } from "./style";

// PLACEHOLDER COPY. Replace with the Stronger Families curriculum text (Strengths / Potential Limitation /
// Potential Sources of Conflict, Problem Solving and Making Decisions breakouts) once it is supplied.
// Keep the shapes below and the UI needs no changes.
export const CONTENT_IS_PLACEHOLDER = true;

type StyleCopy = {
  summary: string;
  limitation: string;
  do: string[];
  dont: string[];
};

export const STYLE_COPY: Record<StyleKey, StyleCopy> = {
  Efficient: {
    summary: "Focused and systematic. Values getting the work done right, with a plan.",
    limitation: "Can seem rigid or impersonal when plans change",
    do: ["Lead with the goal and the plan", "Keep it concise and organized"],
    dont: ["Don't change course without explaining why"],
  },
  Driven: {
    summary: "Results-oriented. Bold and decisive under pressure. Can come across blunt when others need more time.",
    limitation: "Impatient, demanding, desires control",
    do: ["Open with your recommendation, then your reasoning", "Name the one risk that actually matters"],
    dont: ["Don't ask for more time without offering a decision now"],
  },
  Persuasive: {
    summary: "Energetic and expressive. Moves people with enthusiasm and gets others on board.",
    limitation: "Can overpromise or skip the details",
    do: ["Make room for ideas and conversation", "Confirm details in writing afterward"],
    dont: ["Don't open with a wall of data"],
  },
  Relational: {
    summary: "Warm and encouraging. Builds trust quickly and keeps people connected.",
    limitation: "May avoid hard conversations to protect relationships",
    do: ["Start with the person, then the task", "Invite their view before deciding"],
    dont: ["Don't treat their feelings as a distraction"],
  },
  "Peace Keeping": {
    summary: "Calm and accommodating. Values harmony and a steady environment.",
    limitation: "May go along rather than say what they really think",
    do: ["Give advance notice of change", "Ask directly for their honest view"],
    dont: ["Don't mistake quiet for agreement"],
  },
  Steady: {
    summary: "Dependable and patient. Consistent, loyal, and a stabilizing presence.",
    limitation: "Can resist sudden change and be slow to speak up",
    do: ["Explain what is changing and what is staying the same", "Allow time to process"],
    dont: ["Don't spring surprises in the moment"],
  },
  Coordinating: {
    summary: "Cooperative and careful. Brings people and processes together.",
    limitation: "Can be indecisive when input is mixed",
    do: ["Clarify who decides", "Give them the full picture"],
    dont: ["Don't rush them to commit without context"],
  },
  Accurate: {
    summary: "Careful and analytical. Wants the facts right before committing.",
    limitation: "Perfectionist, overanalyzes, slow decision-making",
    do: ["Bring facts and let them check the details", "Give time to think it through"],
    dont: ["Don't push for a snap call on something complex"],
  },
  Balanced: {
    summary: "A flexible style with no strong lean. Adapts to what the situation calls for.",
    limitation: "Can be harder to read, so ask what they need",
    do: ["Ask how they prefer to work through this", "Check in rather than assume"],
    dont: ["Don't assume a single preferred approach"],
  },
};

export const PAIRING_COPY: Record<PairingKind, { label: string; text: string; summary: string }> = {
  "same-focus-different-pace": {
    label: "Same focus, different pace",
    summary: "You share a focus. The gap is pace, not direction.",
    text: "You want the same outcome at a different speed. Agree on a timeline up front so neither of you reads the other as careless or as stalling.",
  },
  "same-pace-different-focus": {
    label: "Same pace, different focus",
    summary: "You move at a similar pace. The gap is task versus people.",
    text: "You move at the same speed but point it at different things. Name what you are each optimizing for before deciding.",
  },
  "different-both": {
    label: "Different pace and focus",
    summary: "You differ on both pace and focus.",
    text: "Expect the conversation to feel different to each of you. Say what you need out loud and ask what they need in return.",
  },
  similar: {
    label: "Close match",
    summary: "You are close on both pace and focus.",
    text: "You will likely click quickly. Watch for shared blind spots, since neither of you may raise what you both tend to skip.",
  },
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

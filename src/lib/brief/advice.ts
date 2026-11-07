import data from "./get-advice.json";
import type { StyleKey } from "./style";

// OXYGEN Insight "Get Advice" language. Source: get-advice-snippets-all-profiles.json (see the Developer Guide).
// Lookup is by ID: {section}-{them} or {section}-{them}-{you}, using natural profiles only.

export type AdviceSnippet = {
  id: string;
  section: string;
  them: string;
  you: string;
  hook: string;
  going: string;
  try: string;
  instead: string;
  status: "Draft" | "Reviewed" | "Approved" | "Retired";
  kind: string;
};

// Drafts show for now. Set GET_ADVICE_APPROVED_ONLY=true once Noel and Karissa have approved the language.
const approvedOnly = () => process.env.GET_ADVICE_APPROVED_ONLY === "true";

const snippets = data.snippets as AdviceSnippet[];
const byId = new Map(snippets.map((s) => [s.id, s]));
const slug = (k: string) => k.toLowerCase().replace(/\s+/g, "-");

function find(id: string): AdviceSnippet | null {
  const s = byId.get(id);
  if (!s || s.status === "Retired") return null;
  if (approvedOnly() && s.status !== "Approved") return null;
  return s;
}

export function profileSummary(key: StyleKey) {
  return data.profiles.find((p) => p.name === key) ?? null;
}

// "Getting things done: Getting a decision" -> { group, title }
export function sectionLabel(s: AdviceSnippet) {
  const [group, title] = s.section.includes(":") ? s.section.split(/:\s*/, 2) : ["", s.section];
  return { group, title };
}

export type AdviceSet = {
  blend: AdviceSnippet | null;
  pair: AdviceSnippet[]; // decision, together, disagree
  single: AdviceSnippet[]; // everyday, recognizing, checkin
  hasDrafts: boolean;
};

// `them` and `you` are compass styles. "Balanced" has no written language, so those parts come back empty.
export function adviceFor(them: StyleKey, you: StyleKey): AdviceSet {
  const t = slug(them);
  const y = slug(you);
  const blend = find(`blend-${t}-${y}`);
  const pair = ["decision", "together", "disagree"].map((s) => find(`${s}-${t}-${y}`));
  const single = ["everyday", "recognizing", "checkin"].map((s) => find(`${s}-${t}`));
  const present = [blend, ...pair, ...single].filter((s): s is AdviceSnippet => s !== null);
  return {
    blend,
    pair: pair.filter((s): s is AdviceSnippet => s !== null),
    single: single.filter((s): s is AdviceSnippet => s !== null),
    hasDrafts: present.some((s) => s.status !== "Approved"),
  };
}

export const CHECKIN_SAFETY_NOTE =
  "This is a conversation aid, not a clinical tool. If someone may be in crisis, follow your chain of command and local chaplain resources, or contact the Military Crisis Line: 988, then press 1.";

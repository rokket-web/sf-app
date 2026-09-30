import { and, eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { assessmentLinks, assessmentResults, resultAccessGrants } from "@/db/schema";
import { refreshResults } from "./service";
import type { DiscScores, TtiReportSection } from "./types";

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

// The single gate for reading anyone's assessment results.
// Allowed: your own results, or results whose owner granted you access (per user).
export async function canViewResults(viewerId: string, ownerId: string) {
  if (viewerId === ownerId) return true;
  const grant = await db.query.resultAccessGrants.findFirst({
    where: and(eq(resultAccessGrants.ownerId, ownerId), eq(resultAccessGrants.viewerId, viewerId)),
  });
  return !!grant;
}

export type DiscView = {
  natural: DiscScores;
  adapted: DiscScores;
  graphs: { natural?: string; adapted?: string; wheel?: string };
  reportDate: string | null;
  fetchedAt: Date;
};

const isScore = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isDisc = (v: unknown): v is DiscScores =>
  !!v && typeof v === "object" && (["d", "i", "s", "c"] as const).every((k) => isScore((v as DiscScores)[k]));

// Only trust graph images served from the TTI host we are configured to use.
function trustedGraph(url: unknown) {
  if (typeof url !== "string") return undefined;
  try {
    const allowed = new URL(process.env.TTI_API_BASE ?? "https://api.ttiadmin.com").origin;
    return new URL(url).origin === allowed ? url : undefined;
  } catch {
    return undefined;
  }
}

function toDiscView(data: unknown, fetchedAt: Date): DiscView | null {
  const d = data as { scores?: { disc?: { natural?: unknown; adapted?: unknown } }; graphs?: Record<string, unknown>; report_date?: string };
  const disc = d?.scores?.disc;
  if (!isDisc(disc?.natural) || !isDisc(disc?.adapted)) return null;
  return {
    natural: disc.natural,
    adapted: disc.adapted,
    graphs: {
      natural: trustedGraph(d.graphs?.disc_natural),
      adapted: trustedGraph(d.graphs?.disc_adapted),
      wheel: trustedGraph(d.graphs?.disc_wheel),
    },
    reportDate: d.report_date ?? null,
    fetchedAt,
  };
}

export type ResultsOutcome =
  | { status: "ok"; disc: DiscView }
  | { status: "forbidden" }
  | { status: "not_linked" }
  | { status: "unavailable"; reason: string };

// Returns cached DISC results for `ownerId` if `viewerId` may see them.
// Refreshes from TTI when missing or older than 24h; falls back to stale cache if TTI fails.
export async function getDiscResults(viewerId: string, ownerId: string): Promise<ResultsOutcome> {
  if (!(await canViewResults(viewerId, ownerId))) return { status: "forbidden" };

  const link = await db.query.assessmentLinks.findFirst({ where: eq(assessmentLinks.userId, ownerId) });
  if (!link) return { status: "not_linked" };

  let cached = await db.query.assessmentResults.findFirst({ where: eq(assessmentResults.linkId, link.id) });
  const stale = !cached || Date.now() - cached.fetchedAt.getTime() > STALE_AFTER_MS;

  if (stale) {
    try {
      await refreshResults(ownerId);
      cached = await db.query.assessmentResults.findFirst({ where: eq(assessmentResults.linkId, link.id) });
    } catch (e) {
      if (!cached) return { status: "unavailable", reason: (e as Error).message };
    }
  }

  const disc = cached ? toDiscView(cached.data, cached.fetchedAt) : null;
  return disc ? { status: "ok", disc } : { status: "unavailable", reason: "No DISC results in this report." };
}

// Written report for `ownerId`, if `viewerId` may see their results (themselves, or granted per user).
export async function getReportSections(viewerId: string, ownerId: string): Promise<TtiReportSection[] | null> {
  if (!(await canViewResults(viewerId, ownerId))) return null;
  const link = await db.query.assessmentLinks.findFirst({ where: eq(assessmentLinks.userId, ownerId) });
  if (!link) return null;

  const read = async () =>
    (await db.query.assessmentResults.findFirst({ where: eq(assessmentResults.linkId, link.id) }))?.data as
      | { report?: { sections?: TtiReportSection[] } }
      | undefined;

  let data = await read();
  if (!data?.report?.sections) {
    // Results cached before the narrative was stored: backfill once.
    try {
      await refreshResults(ownerId);
      data = await read();
    } catch {
      return null;
    }
  }
  const sections = data?.report?.sections;
  return Array.isArray(sections) ? sections : null;
}

export const getMyReportSections = (userId: string) => getReportSections(userId, userId);

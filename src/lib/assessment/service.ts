import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { assessmentLinks, assessmentResults } from "@/db/schema";
import { tti } from "./tti-client";
import type { TtiRespondent } from "./types";

export type LinkOutcome =
  | { status: "linked"; passwd: string }
  | { status: "none" }
  | { status: "ambiguous"; candidates: TtiRespondent[] };

async function saveLink(userId: string, passwd: string) {
  const taken = await db.query.assessmentLinks.findFirst({ where: eq(assessmentLinks.ttiExternalId, passwd) });
  if (taken && taken.userId !== userId) throw new Error("That TTI respondent is already linked to another user.");
  await db
    .insert(assessmentLinks)
    .values({ userId, ttiExternalId: passwd })
    .onConflictDoUpdate({ target: assessmentLinks.userId, set: { ttiExternalId: passwd } });
}

// Auto-link only when exactly one TTI respondent has this email. Never guesses.
export async function autoLinkByEmail(userId: string, email: string): Promise<LinkOutcome> {
  const wanted = email.trim().toLowerCase();
  const matches = (await tti.respondentsByEmail(wanted)).filter(
    (r) => r.email?.trim().toLowerCase() === wanted,
  );
  if (matches.length === 0) return { status: "none" };
  if (matches.length > 1) return { status: "ambiguous", candidates: matches };
  await saveLink(userId, matches[0].passwd);
  return { status: "linked", passwd: matches[0].passwd };
}

// Admin-chosen link. Confirms the respondent exists on TTI first.
export async function linkManually(userId: string, passwd: string) {
  const respondent = await tti.respondent(passwd.trim());
  await saveLink(userId, respondent.passwd);
  return respondent;
}

export async function unlink(userId: string) {
  await db.delete(assessmentLinks).where(eq(assessmentLinks.userId, userId));
}

// Fetches the respondent's latest report summary from TTI and caches it (one row per link).
export async function refreshResults(userId: string) {
  const link = await db.query.assessmentLinks.findFirst({ where: eq(assessmentLinks.userId, userId) });
  if (!link) throw new Error("User is not linked to a TTI respondent.");

  const respondent = await tti.respondent(link.ttiExternalId);
  if (!respondent.most_recent_report_id) throw new Error("This respondent has no completed report yet.");

  const summary = await tti.reportSummary(respondent.most_recent_report_id);
  // The PDF URL is signed and expires, so it is not cached.
  const cacheable: Record<string, unknown> = { ...summary };
  delete cacheable.report_pdf_url;

  // The narrative report is best-effort: if it fails, the scores and graphs are still cached.
  // Only the section content is kept (not respondent names or other info fields).
  try {
    const full = await tti.fullReport(respondent.most_recent_report_id);
    cacheable.report = { sections: full.report.sections };
  } catch {
    // leave `report` unset; the results page offers a refresh
  }

  await db
    .insert(assessmentResults)
    .values({ linkId: link.id, data: cacheable, fetchedAt: new Date() })
    .onConflictDoUpdate({
      target: assessmentResults.linkId,
      set: { data: cacheable, fetchedAt: new Date() },
    });
  return cacheable;
}

import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/lib/current-user";
import { assessmentLinks } from "@/db/schema";
import { tti } from "@/lib/assessment/tti-client";

// Redirects to a fresh TTI PDF link for the signed-in user's own report.
// The PDF URL is signed and short-lived, so it is fetched on demand rather than cached.
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const link = await db.query.assessmentLinks.findFirst({ where: eq(assessmentLinks.userId, me.id) });
  if (!link) return new Response("No assessment linked.", { status: 404 });

  try {
    const respondent = await tti.respondent(link.ttiExternalId);
    if (!respondent.most_recent_report_id) return new Response("No report yet.", { status: 404 });
    const summary = await tti.reportSummary(respondent.most_recent_report_id);
    const pdf = new URL(summary.report_pdf_url ?? "");
    const allowed = new URL(process.env.TTI_API_BASE ?? "https://api.ttiadmin.com").origin;
    if (pdf.origin !== allowed) return new Response("Report unavailable.", { status: 502 });
    return Response.redirect(pdf.toString(), 302);
  } catch {
    return new Response("Report unavailable right now.", { status: 502 });
  }
}

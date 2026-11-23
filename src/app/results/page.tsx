import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { profiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getDiscResults, getMyReportSections } from "@/lib/assessment/access";
import { RefreshButton } from "./refresh-button";
import { AssessmentBody } from "./assessment-body";

export default async function ResultsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");

  const outcome = await getDiscResults(me.id, me.id);

  if (outcome.status !== "ok") {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-6">
        <BackLink />
        <h1 className="text-2xl font-semibold">My assessment results</h1>
        <p>
          {outcome.status === "not_linked"
            ? "Your assessment isn't linked yet. Ask an admin to link your assessment."
            : outcome.status === "unavailable"
              ? `Your results aren't available right now. ${outcome.reason}`
              : "Not available."}
        </p>
      </main>
    );
  }

  const { disc } = outcome;
  const sections = await getMyReportSections(me.id);
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, me.id) });
  const name = profile?.displayName ?? me.email;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 p-6">
      <div className="space-y-2">
        <BackLink />
        <h1 className="text-2xl font-semibold">My assessment results</h1>
        <p className="text-sm opacity-70">
          Report dated{" "}
          <span className="data">{disc.reportDate ? new Date(disc.reportDate).toLocaleDateString() : "unknown"}</span> · last synced{" "}
          <span className="data">{disc.fetchedAt.toLocaleDateString()}</span>
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <a href="/api/my-report" target="_blank" rel="noopener" className="rounded bg-primary px-4 py-2 text-sm text-white hover:brightness-110">
            Open full PDF report
          </a>
          {me.isAdmin && <RefreshButton />}
        </div>
      </div>

      <AssessmentBody disc={disc} sections={sections} name={name} />
    </main>
  );
}

function BackLink() {
  return (
    <Link href="/profile" className="text-sm underline">
      ← Profile
    </Link>
  );
}

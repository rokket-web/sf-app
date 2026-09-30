import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/lib/current-user";
import { getDiscResults, getReportSections } from "@/lib/assessment/access";
import { profiles } from "@/db/schema";
import { AssessmentBody } from "../../results/assessment-body";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ViewAssessmentPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");
  if (userId === me.id) redirect("/results");
  if (!UUID.test(userId)) notFound();

  const outcome = await getDiscResults(me.id, userId);
  // Same response for "no such user" and "not shared with you", so existence isn't revealed.
  if (outcome.status === "forbidden") notFound();

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
  const name = profile?.displayName ?? "This person";

  if (outcome.status !== "ok") {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-6">
        <Link href="/groups" className="text-sm underline">
          ← Groups
        </Link>
        <h1 className="text-2xl font-semibold">{name}&apos;s assessment</h1>
        <p>
          {outcome.status === "not_linked"
            ? `${name} doesn't have assessment results linked yet.`
            : `${name}'s results aren't available right now. ${outcome.reason}`}
        </p>
      </main>
    );
  }

  const sections = await getReportSections(me.id, userId);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 p-6">
      <div className="space-y-2">
        <Link href="/groups" className="text-sm underline">
          ← Groups
        </Link>
        <h1 className="text-2xl font-semibold">{name}&apos;s assessment</h1>
        <p className="text-sm opacity-70">
          Shared with you by {name} · last synced {outcome.disc.fetchedAt.toLocaleDateString()}
        </p>
        <Link href={`/compare/${userId}`} className="inline-block rounded border border-black/20 px-3 py-1 text-sm dark:border-white/30">
          View comparison with mine
        </Link>
      </div>
      <AssessmentBody disc={outcome.disc} sections={sections} />
    </main>
  );
}

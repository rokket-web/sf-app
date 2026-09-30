import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/lib/current-user";
import { getDiscResults, getReportSections } from "@/lib/assessment/access";
import { profiles } from "@/db/schema";
import { Brief } from "../brief";
import { DiscCompare } from "../disc-compare";

export default async function ComparePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");
  if (userId === me.id) redirect("/compare");

  const [theirs, mine, themSections] = await Promise.all([
    getDiscResults(me.id, userId),
    getDiscResults(me.id, me.id),
    getReportSections(me.id, userId),
  ]);

  // Same response for "no such user" and "not shared with you", so existence isn't revealed.
  if (theirs.status === "forbidden") notFound();

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
  const name = profile?.displayName ?? "Them";

  // The brief has its own header, so the page title only shows when there is no brief.
  const showTitle = theirs.status !== "ok" || mine.status !== "ok";

  let body;
  if (theirs.status !== "ok") {
    body = (
      <p className="px-4 sm:px-0">
        {theirs.status === "not_linked"
          ? `${name} doesn't have assessment results linked yet.`
          : `${name}'s results aren't available right now. ${theirs.reason}`}
      </p>
    );
  } else if (mine.status !== "ok") {
    body = (
      <p className="px-4 sm:px-0">
        {mine.status === "not_linked"
          ? "Your own assessment results aren't linked yet. Ask an admin to link your TTI account."
          : `Your results aren't available right now. ${mine.status === "unavailable" ? mine.reason : ""}`}
      </p>
    );
  } else {
    const you = { name: "You", disc: mine.disc };
    const them = { name, disc: theirs.disc };
    body = (
      <>
        <Brief you={you} them={them} themSections={themSections} />
        <details className="group mx-4 mt-2 rounded-2xl border border-black/10 sm:mx-auto sm:w-full dark:border-white/20">
          <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 text-[15px] font-semibold">
            Full comparison
            <span aria-hidden className="transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="space-y-6 border-t border-black/10 p-4 dark:border-white/20">
            <DiscCompare you={you} them={them} />
          </div>
        </details>
      </>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 pb-8 sm:space-y-6 sm:p-6">
      <div className="px-4 pt-1 sm:px-0 sm:pt-0">
        <Link href="/compare" className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm underline">
          ← All comparisons
        </Link>
        <h1 className={showTitle ? "text-2xl font-semibold" : "sr-only"}>You &amp; {name}</h1>
        {showTitle && theirs.status === "ok" && (
          <p className="text-sm opacity-70">
            {name}&apos;s results last updated {theirs.disc.fetchedAt.toLocaleDateString()}.
          </p>
        )}
      </div>
      {body}
    </main>
  );
}

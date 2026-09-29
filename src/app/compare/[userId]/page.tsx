import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/lib/current-user";
import { getDiscResults } from "@/lib/assessment/access";
import { profiles } from "@/db/schema";
import { DiscCompare } from "../disc-compare";

export default async function ComparePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");
  if (userId === me.id) redirect("/compare");

  const [theirs, mine] = await Promise.all([getDiscResults(me.id, userId), getDiscResults(me.id, me.id)]);

  // Same response for "no such user" and "not shared with you", so existence isn't revealed.
  if (theirs.status === "forbidden") notFound();

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
  const name = profile?.displayName ?? "Them";

  let body;
  if (theirs.status !== "ok") {
    body = (
      <p>
        {theirs.status === "not_linked"
          ? `${name} doesn't have assessment results linked yet.`
          : `${name}'s results aren't available right now. ${theirs.reason}`}
      </p>
    );
  } else if (mine.status !== "ok") {
    body = (
      <p>
        {mine.status === "not_linked"
          ? "Your own assessment results aren't linked yet. Ask an admin to link your TTI account."
          : `Your results aren't available right now. ${mine.status === "unavailable" ? mine.reason : ""}`}
      </p>
    );
  } else {
    body = <DiscCompare you={{ name: "You", disc: mine.disc }} them={{ name, disc: theirs.disc }} />;
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-6">
      <div>
        <Link href="/compare" className="text-sm underline">
          ← All comparisons
        </Link>
        <h1 className="text-2xl font-semibold">You &amp; {name}</h1>
        {theirs.status === "ok" && (
          <p className="text-sm opacity-70">
            {name}&apos;s results last updated {theirs.disc.fetchedAt.toLocaleDateString()}.
          </p>
        )}
      </div>
      {body}
    </main>
  );
}

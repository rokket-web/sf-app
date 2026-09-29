import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/lib/current-user";
import { resultAccessGrants } from "@/db/schema";

export default async function CompareIndex() {
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");

  const grants = await db.query.resultAccessGrants.findMany({
    where: eq(resultAccessGrants.viewerId, me.id),
    with: { owner: { with: { profile: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Compare styles</h1>
      {grants.length === 0 ? (
        <p className="opacity-70">Nobody has shared their results with you yet.</p>
      ) : (
        <ul className="divide-y divide-black/10 dark:divide-white/20">
          {grants.map((g) => (
            <li key={g.id} className="flex items-center justify-between py-3">
              <span>{g.owner.profile?.displayName ?? g.owner.email}</span>
              <Link href={`/compare/${g.owner.id}`} className="underline">
                Compare
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/lib/current-user";
import { profiles, resultAccessGrants } from "@/db/schema";
import { ProfileForm } from "./profile-form";
import { ShareForm } from "./share-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });
  if (!profile) redirect("/sign-in");

  const grants = await db.query.resultAccessGrants.findMany({
    where: eq(resultAccessGrants.ownerId, user.id),
    with: { viewer: { with: { profile: true } } },
  });
  const viewers = grants.map((g) => ({
    grantId: g.id,
    label: `${g.viewer.profile?.displayName ?? g.viewer.email} (${g.viewer.email})`,
  }));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Your profile</h1>
      <p className="text-sm opacity-70">Signed in as {user.email}</p>
      <ProfileForm profile={profile} />

      <Link
        href="/results"
        className="inline-block rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
      >
        View my assessment results
      </Link>

      <section className="space-y-2 border-t border-black/10 pt-6 dark:border-white/20">
        <h2 className="text-lg font-medium">Who can see my assessment results</h2>
        <p className="text-sm opacity-70">
          People you add here can view your assessment (scores, graphs and written report) and compare it with theirs. You can also share from a group page. You can stop sharing at any time.
        </p>
        <ShareForm viewers={viewers} />
      </section>
    </main>
  );
}

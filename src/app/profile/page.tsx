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

      <section className="space-y-2 border-t border-black/10 pt-6 dark:border-white/20">
        <h2 className="text-lg font-medium">Who can see my assessment results</h2>
        <p className="text-sm opacity-70">
          Only people you add here can compare their results with yours. You can stop sharing at any time.
        </p>
        <ShareForm viewers={viewers} />
      </section>
    </main>
  );
}

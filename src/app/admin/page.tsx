import { clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/drizzle";
import { InviteForm } from "./invite-form";
import { TtiSearch, UserAssessmentControls } from "./assessment-controls";
import { revokeInvitation } from "./actions";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) notFound();

  const allUsers = await db.query.users.findMany({
    with: { profile: true, assessmentLink: { with: { result: true } } },
    orderBy: (u, { asc }) => asc(u.createdAt),
  });

  const client = await clerkClient();
  const { data: invitations } = await client.invitations.getInvitationList({ status: "pending" });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Invite a user</h2>
        <InviteForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Pending invitations</h2>
        {invitations.length === 0 ? (
          <p className="text-sm opacity-70">None.</p>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/20">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-2">
                <span>{inv.emailAddress}</span>
                <form action={revokeInvitation}>
                  <input type="hidden" name="id" value={inv.id} />
                  <button className="text-sm text-red-600 underline">Revoke</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Users &amp; TTI assessments</h2>
        <ul className="divide-y divide-black/10 dark:divide-white/20">
          {allUsers.map((u) => (
            <li key={u.id} className="space-y-2 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span>
                  {u.profile?.displayName ?? u.email} <span className="text-sm opacity-60">{u.email}</span>
                </span>
                <span className="text-xs opacity-70">
                  {u.assessmentLink
                    ? `Linked ${u.assessmentLink.ttiExternalId}${
                        u.assessmentLink.result
                          ? ` · fetched ${u.assessmentLink.result.fetchedAt.toLocaleDateString()}`
                          : " · no results yet"
                      }`
                    : "Not linked"}
                </span>
              </div>
              <UserAssessmentControls userId={u.id} linkedTo={u.assessmentLink?.ttiExternalId ?? null} />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Look up a TTI respondent</h2>
        <TtiSearch />
      </section>
    </main>
  );
}

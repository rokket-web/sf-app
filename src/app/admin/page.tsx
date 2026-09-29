import Link from "next/link";
import { clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/drizzle";
import { InviteForm } from "./invite-form";
import { TtiSearch, UserAssessmentControls } from "./assessment-controls";
import { revokeInvitation } from "./actions";

const TABS = [
  { id: "users", label: "Manage users" },
  { id: "invites", label: "Invite by email" },
] as const;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) notFound();

  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "invites" ? "invites" : "users";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <nav className="flex gap-1 border-b border-black/10 dark:border-white/20" aria-label="Admin sections">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              tab === t.id ? "border-current font-medium" : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "users" ? <ManageUsers /> : <Invites />}
    </main>
  );
}

async function ManageUsers() {
  const allUsers = await db.query.users.findMany({
    with: { profile: true, assessmentLink: { with: { result: true } } },
    orderBy: (u, { asc }) => asc(u.createdAt),
  });

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Current users ({allUsers.length})</h2>
        <ul className="divide-y divide-black/10 dark:divide-white/20">
          {allUsers.map((u) => (
            <li key={u.id} className="space-y-2 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  {u.profile?.displayName ?? u.email} <span className="text-sm opacity-60">{u.email}</span>
                  {u.isAdmin && <span className="ml-2 rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/20">admin</span>}
                  {u.status !== "active" && (
                    <span className="ml-2 rounded bg-red-600/15 px-1.5 py-0.5 text-xs text-red-600">{u.status}</span>
                  )}
                </span>
                <span className="text-xs opacity-70">
                  {u.assessmentLink
                    ? `Linked ${u.assessmentLink.ttiExternalId}${
                        u.assessmentLink.result
                          ? ` · fetched ${u.assessmentLink.result.fetchedAt.toLocaleDateString()}`
                          : " · no results yet"
                      }`
                    : "Not linked to TTI"}
                </span>
              </div>
              <UserAssessmentControls userId={u.id} linkedTo={u.assessmentLink?.ttiExternalId ?? null} />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Add a user from TTI</h2>
        <p className="text-sm opacity-70">
          Search your TTI respondents by email or name. <strong>Add to Users</strong> creates their account now and
          imports their assessment results (no email is sent). <strong>Invite via Email</strong> sends them an
          invitation, and their assessment links when they sign up.
        </p>
        <TtiSearch />
      </section>
    </div>
  );
}

async function Invites() {
  const client = await clerkClient();
  const { data: invitations } = await client.invitations.getInvitationList({ status: "pending" });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Invite a user by email</h2>
        <p className="text-sm opacity-70">
          For someone who isn&apos;t in TTI yet, or when you don&apos;t need their assessment linked. To invite
          someone from TTI, use Manage users.
        </p>
        <InviteForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Pending invitations ({invitations.length})</h2>
        {invitations.length === 0 ? (
          <p className="text-sm opacity-70">None.</p>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/20">
            {invitations.map((inv) => {
              const tti = (inv.publicMetadata as { ttiRespondentId?: string } | undefined)?.ttiRespondentId;
              return (
                <li key={inv.id} className="flex items-center justify-between py-2">
                  <span>
                    {inv.emailAddress}
                    {tti && <span className="ml-2 font-mono text-xs opacity-60">TTI {tti}</span>}
                  </span>
                  <form action={revokeInvitation}>
                    <input type="hidden" name="id" value={inv.id} />
                    <button className="text-sm text-red-600 underline">Revoke</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

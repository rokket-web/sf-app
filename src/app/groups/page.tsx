import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/lib/current-user";
import { groupMembers, invitations } from "@/db/schema";
import { CreateGroupForm } from "./group-forms";
import { respondToInvitation } from "./actions";

type Member = { user: { email: string; profile: { displayName: string | null } | null } };

const firstName = (m: Member) => (m.user.profile?.displayName?.trim().split(/\s+/)[0] || m.user.email.split("@")[0]);

// "3 members" with a hover/focus popup listing members' first names.
function MemberCount({ members }: { members: Member[] }) {
  const names = members.map(firstName).sort((a, b) => a.localeCompare(b));
  return (
    <span className="group/members relative cursor-help outline-none" tabIndex={0}>
      {members.length} {members.length === 1 ? "member" : "members"}
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-10 mt-1 w-max max-w-56 rounded border border-black/10 bg-white px-2 py-1 text-xs text-black opacity-100 shadow-md group-hover/members:visible group-focus/members:visible"
      >
        {names.join(", ")}
      </span>
    </span>
  );
}

export default async function GroupsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");

  const [memberships, invites] = await Promise.all([
    db.query.groupMembers.findMany({ where: eq(groupMembers.userId, me.id), with: { group: { with: { members: { with: { user: { with: { profile: true } } } } } } } }),
    db.query.invitations.findMany({
      where: and(eq(invitations.inviteeEmail, me.email.toLowerCase()), eq(invitations.status, "pending")),
      with: { group: true, invitedBy: { with: { profile: true } } },
    }),
  ]);

  const mine = new Set(memberships.map((m) => m.groupId));
  const otherGroups = me.isAdmin
    ? (await db.query.groups.findMany({ with: { members: { with: { user: { with: { profile: true } } } }, owner: { with: { profile: true } } } })).filter(
        (g) => !mine.has(g.id),
      )
    : [];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Groups</h1>

      {invites.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Invitations</h2>
          <ul className="divide-y divide-black/10 dark:divide-white/20">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <strong>{i.group.name}</strong>{" "}
                  <span className="text-sm opacity-70">
                    ({i.group.type}) · from {i.invitedBy.profile?.displayName ?? i.invitedBy.email}
                  </span>
                </span>
                <form action={respondToInvitation} className="flex gap-2">
                  <input type="hidden" name="invitationId" value={i.id} />
                  <button name="decision" value="accept" className="rounded bg-black px-3 py-1 text-sm text-white dark:bg-white dark:text-black">
                    Accept
                  </button>
                  <button name="decision" value="decline" className="rounded border border-black/20 px-3 py-1 text-sm dark:border-white/30">
                    Decline
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Your groups</h2>
        {memberships.length === 0 ? (
          <p className="opacity-70">You aren&apos;t in any groups yet.</p>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/20">
            {memberships.map((m) => (
              <li key={m.groupId} className="flex items-center justify-between py-3">
                <Link href={`/groups/${m.groupId}`} className="underline">
                  {m.group.name}
                </Link>{" "}
                <span className="mr-auto pl-1 text-sm text-foreground/70">(<MemberCount members={m.group.members} />)</span>
                <span className="text-sm opacity-70">
                  {m.group.type} · {m.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {me.isAdmin && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">All other groups (admin)</h2>
          {otherGroups.length === 0 ? (
            <p className="opacity-70">No other groups.</p>
          ) : (
            <ul className="divide-y divide-black/10 dark:divide-white/20">
              {otherGroups.map((g) => (
                <li key={g.id} className="flex items-center justify-between py-3">
                  <Link href={`/groups/${g.id}`} className="underline">
                    {g.name}
                  </Link>
                  <span className="text-sm text-foreground/70">
                    {g.type} · <MemberCount members={g.members} /> · owner {g.owner.profile?.displayName ?? g.owner.email}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Create a group</h2>
        <CreateGroupForm />
      </section>
    </main>
  );
}

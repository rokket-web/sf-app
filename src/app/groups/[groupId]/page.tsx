import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/lib/current-user";
import { getMembership } from "@/lib/groups";
import { groups, invitations, resultAccessGrants, users } from "@/db/schema";
import { AddExistingUserForm, InviteMemberForm } from "../group-forms";
import {
  cancelInvitation,
  deleteGroup,
  leaveGroup,
  removeMember,
  shareWithMember,
  stopSharingWithMember,
} from "../actions";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");

  // Non-members get the same 404 as a group that doesn't exist. Admins can open any group.
  const membership = UUID.test(groupId) ? await getMembership(groupId, me.id) : undefined;
  if (!membership && !(me.isAdmin && UUID.test(groupId))) notFound();
  const isOwner = membership?.role === "owner";
  const canManage = isOwner || me.isAdmin;

  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
    with: { members: { with: { user: { with: { profile: true } } } } },
  });
  if (!group) notFound();

  const memberIds = group.members.map((m) => m.userId).filter((id) => id !== me.id);
  const [grants, sharedByMe, pending] = await Promise.all([
    memberIds.length
      ? db.query.resultAccessGrants.findMany({
          where: and(eq(resultAccessGrants.viewerId, me.id), inArray(resultAccessGrants.ownerId, memberIds)),
        })
      : [],
    memberIds.length
      ? db.query.resultAccessGrants.findMany({
          where: and(eq(resultAccessGrants.ownerId, me.id), inArray(resultAccessGrants.viewerId, memberIds)),
        })
      : [],
    canManage
      ? db.query.invitations.findMany({
          where: and(eq(invitations.groupId, groupId), eq(invitations.status, "pending")),
        })
      : [],
  ]);
  const canCompare = new Set(grants.map((g) => g.ownerId));
  const iShared = new Set(sharedByMe.map((g) => g.viewerId));

  const inGroup = new Set(group.members.map((m) => m.userId));
  const candidates = me.isAdmin
    ? (await db.query.users.findMany({ where: eq(users.status, "active"), with: { profile: true } }))
        .filter((u) => !inGroup.has(u.id))
        .map((u) => ({ id: u.id, label: `${u.profile?.displayName ?? u.email} (${u.email})` }))
        .sort((a, b) => a.label.localeCompare(b.label))
    : [];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 p-6">
      <div>
        <Link href="/groups" className="text-sm underline">
          ← Groups
        </Link>
        <h1 className="text-2xl font-semibold">{group.name}</h1>
        <p className="text-sm opacity-70">{group.type === "work" ? "Work group" : "Personal group"}</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Members ({group.members.length})</h2>
        <ul className="divide-y divide-black/10 dark:divide-white/20">
          {group.members.map((m) => {
            const p = m.user.profile;
            const showDetails = p && p.visibility !== "private";
            const self = m.userId === me.id;
            return (
              <li key={m.userId} className="flex gap-3 py-3">
                {p?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt="" className="size-12 rounded-full object-cover" />
                ) : (
                  <div className="size-12 rounded-full bg-black/10 dark:bg-white/20" />
                )}
                <div className="flex-1 space-y-1">
                  <div>
                    <strong>{p?.displayName ?? m.user.email}</strong>
                    {self && " (you)"}
                    <span className="ml-2 text-xs opacity-70">{m.role}</span>
                  </div>
                  {showDetails && p.bio && <p className="text-sm">{p.bio}</p>}
                  {showDetails && (p.contactEmail || p.contactPhone) && (
                    <p className="text-sm opacity-70">{[p.contactEmail, p.contactPhone].filter(Boolean).join(" · ")}</p>
                  )}
                  {!self && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {canCompare.has(m.userId) ? (
                        <>
                          <Link href={`/assessment/${m.userId}`} className={`${btnPrimary} no-underline`}>
                            View Assessment
                          </Link>
                          <Link href={`/compare/${m.userId}`} className={`${btnOutline} no-underline`}>
                            View Comparison
                          </Link>
                        </>
                      ) : (
                        <span className="text-sm opacity-60">Hasn&apos;t shared their assessment with you</span>
                      )}
                      {membership &&
                        (iShared.has(m.userId) ? (
                          <form action={stopSharingWithMember} className="flex items-center gap-2">
                            <input type="hidden" name="groupId" value={groupId} />
                            <input type="hidden" name="userId" value={m.userId} />
                            <span className="text-sm text-green-600">✓ Shared with them</span>
                            <button className="text-sm underline opacity-70">Stop sharing</button>
                          </form>
                        ) : (
                          <form action={shareWithMember}>
                            <input type="hidden" name="groupId" value={groupId} />
                            <input type="hidden" name="userId" value={m.userId} />
                            <button className={btnOutline} title="Lets them view your assessment and compare it with theirs">
                              Share my Assessment
                            </button>
                          </form>
                        ))}
                    </div>
                  )}
                </div>
                {canManage && !self && m.role !== "owner" && (
                  <form action={removeMember}>
                    <input type="hidden" name="groupId" value={groupId} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <button className="text-sm text-red-600 underline">Remove</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {me.isAdmin && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Add an existing user</h2>
          <p className="text-sm opacity-70">Admin only. Adds them to the group immediately, with no invitation.</p>
          <AddExistingUserForm groupId={groupId} candidates={candidates} />
        </section>
      )}

      {canManage && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Invite someone</h2>
          <InviteMemberForm groupId={groupId} />
          {pending.length > 0 && (
            <ul className="divide-y divide-black/10 text-sm dark:divide-white/20">
              {pending.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2">
                  <span>{i.inviteeEmail} · pending</span>
                  <form action={cancelInvitation}>
                    <input type="hidden" name="invitationId" value={i.id} />
                    <button className="text-red-600 underline">Cancel</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="border-t border-black/10 pt-6 dark:border-white/20">
        {isOwner ? (
          <form action={deleteGroup}>
            <input type="hidden" name="groupId" value={groupId} />
            <button className="text-sm text-red-600 underline">Delete this group</button>
          </form>
        ) : membership ? (
          <form action={leaveGroup}>
            <input type="hidden" name="groupId" value={groupId} />
            <button className="text-sm text-red-600 underline">Leave this group</button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

const btnPrimary = "rounded bg-black px-3 py-1 text-sm text-white dark:bg-white dark:text-black";
const btnOutline = "rounded border border-black/20 px-3 py-1 text-sm dark:border-white/30";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/lib/current-user";
import { getMembership, requireOwner } from "@/lib/groups";
import { groupMembers, groups, invitations, users } from "@/db/schema";

export type GroupState = { ok: boolean; message: string } | null;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function createGroup(_prev: GroupState, fd: FormData): Promise<GroupState> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, message: "Not signed in." };

  const name = str(fd, "name").slice(0, 80);
  const type = str(fd, "type");
  if (!name) return { ok: false, message: "Group name is required." };
  if (type !== "work" && type !== "personal") return { ok: false, message: "Choose a group type." };

  const [group] = await db.insert(groups).values({ name, type, ownerId: me.id }).returning();
  await db.insert(groupMembers).values({ groupId: group.id, userId: me.id, role: "owner" });
  redirect(`/groups/${group.id}`);
}

export async function inviteMember(_prev: GroupState, fd: FormData): Promise<GroupState> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, message: "Not signed in." };
  const groupId = str(fd, "groupId");

  try {
    await requireOwner(groupId, me.id);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const email = str(fd, "email").toLowerCase();
  if (!email) return { ok: false, message: "Enter an email address." };

  // The app is invite-only, so group invites go to people who already have an account.
  const target = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!target || target.status !== "active") {
    return { ok: false, message: "No active account with that email. Ask an admin to invite them to the app first." };
  }
  if (await getMembership(groupId, target.id)) return { ok: false, message: "They are already in this group." };

  const pending = await db.query.invitations.findFirst({
    where: and(eq(invitations.groupId, groupId), eq(invitations.inviteeEmail, email), eq(invitations.status, "pending")),
  });
  if (pending) return { ok: false, message: "An invitation is already pending for them." };

  await db.insert(invitations).values({ groupId, invitedByUserId: me.id, inviteeEmail: email });
  revalidatePath(`/groups/${groupId}`);
  return { ok: true, message: `Invitation sent to ${email}.` };
}

export async function respondToInvitation(fd: FormData) {
  const me = await getCurrentUser();
  if (!me) return;

  const invite = await db.query.invitations.findFirst({ where: eq(invitations.id, str(fd, "invitationId")) });
  // Only the person the invitation was sent to can answer it, and only once.
  if (!invite || invite.status !== "pending" || invite.inviteeEmail !== me.email.toLowerCase()) return;

  const accept = str(fd, "decision") === "accept";
  if (accept) {
    await db.insert(groupMembers).values({ groupId: invite.groupId, userId: me.id }).onConflictDoNothing();
  }
  await db
    .update(invitations)
    .set({ status: accept ? "accepted" : "declined", respondedAt: new Date() })
    .where(eq(invitations.id, invite.id));

  revalidatePath("/groups");
  if (accept) redirect(`/groups/${invite.groupId}`);
}

export async function cancelInvitation(fd: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  const invite = await db.query.invitations.findFirst({ where: eq(invitations.id, str(fd, "invitationId")) });
  if (!invite) return;
  await requireOwner(invite.groupId, me.id);
  await db.delete(invitations).where(eq(invitations.id, invite.id));
  revalidatePath(`/groups/${invite.groupId}`);
}

export async function removeMember(fd: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  const groupId = str(fd, "groupId");
  const userId = str(fd, "userId");
  await requireOwner(groupId, me.id);
  if (userId === me.id) return; // the owner can't be removed; delete the group instead
  await db.delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  revalidatePath(`/groups/${groupId}`);
}

export async function leaveGroup(fd: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  const groupId = str(fd, "groupId");
  const m = await getMembership(groupId, me.id);
  if (!m || m.role === "owner") return;
  await db.delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, me.id)));
  redirect("/groups");
}

export async function deleteGroup(fd: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  const groupId = str(fd, "groupId");
  await requireOwner(groupId, me.id);
  await db.delete(groups).where(eq(groups.id, groupId));
  redirect("/groups");
}

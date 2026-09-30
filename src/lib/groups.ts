import { and, eq } from "drizzle-orm";
import { db } from "./drizzle";
import { groupMembers } from "@/db/schema";

export async function getMembership(groupId: string, userId: string) {
  return db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
  });
}

export async function requireOwner(groupId: string, userId: string) {
  const m = await getMembership(groupId, userId);
  if (!m || m.role !== "owner") throw new Error("Only the group owner can do that.");
}

// Group owners manage their own groups; admins can manage any group.
export async function requireManager(groupId: string, user: { id: string; isAdmin: boolean }) {
  if (user.isAdmin) return;
  await requireOwner(groupId, user.id);
}

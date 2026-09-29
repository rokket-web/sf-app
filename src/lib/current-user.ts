import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "./drizzle";
import { assessmentLinks, profiles, users } from "@/db/schema";

// Returns the signed-in user's app record, creating it (and an empty profile) on first visit.
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db.query.users.findFirst({ where: eq(users.clerkUserId, userId) });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!clerkUser || !email) return null;

  const isSuperAdmin =
    !!process.env.SUPER_ADMIN_EMAIL &&
    email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL.toLowerCase();

  const [created] = await db
    .insert(users)
    .values({ clerkUserId: userId, email, isAdmin: isSuperAdmin })
    .onConflictDoNothing()
    .returning();
  const user = created ?? (await db.query.users.findFirst({ where: eq(users.clerkUserId, userId) }))!;

  // Invitations sent from /admin carry the TTI respondent (set server-side; users can't edit public metadata).
  const meta = clerkUser.publicMetadata as { ttiRespondentId?: string; displayName?: string };

  await db
    .insert(profiles)
    .values({
      userId: user.id,
      displayName:
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || meta.displayName || email,
    })
    .onConflictDoNothing();

  if (typeof meta.ttiRespondentId === "string" && meta.ttiRespondentId) {
    await db
      .insert(assessmentLinks)
      .values({ userId: user.id, ttiExternalId: meta.ttiRespondentId })
      .onConflictDoNothing();
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin || user.status !== "active") throw new Error("Forbidden");
  return user;
}

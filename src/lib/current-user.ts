import { cache } from "react";
import { cookies } from "next/headers";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "./drizzle";
import { assessmentLinks, profiles, users } from "@/db/schema";

export const VIEW_AS_COOKIE = "sf_view_as";

// Dev/testing aid, off unless ALLOW_IMPERSONATION=true. Never enable on production.
export const impersonationEnabled = () => process.env.ALLOW_IMPERSONATION === "true";

// Returns the actually signed-in user's app record, creating it (and an empty profile) on first visit.
// Memoized per request. Most code should call getCurrentUser() instead.
export const getRealUser = cache(async () => {
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
});

// The user the app should act as. Normally the signed-in user; when a real admin has switched
// to "view as" another user (and impersonation is enabled), that user instead.
export async function getCurrentUser() {
  const real = await getRealUser();
  if (!real) return null;
  return (await getViewAs(real))?.target ?? real;
}

// Non-null only while a real, active admin is viewing as someone else.
export async function getViewAs(real?: Awaited<ReturnType<typeof getRealUser>>) {
  if (!impersonationEnabled()) return null;
  const me = real ?? (await getRealUser());
  if (!me?.isAdmin || me.status !== "active") return null;

  const id = (await cookies()).get(VIEW_AS_COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id) || id === me.id) return null;

  const target = await db.query.users.findFirst({ where: eq(users.id, id), with: { profile: true } });
  if (!target || target.status !== "active") return null;
  return { real: me, target };
}

// Admin checks always use the real signed-in user, so "view as" can never grant or use admin rights.
export async function requireAdmin() {
  const user = await getRealUser();
  if (!user || !user.isAdmin || user.status !== "active") throw new Error("Forbidden");
  // While viewing as another user, act as that user: admin tools are unavailable until switching back.
  if ((await getCurrentUser())?.id !== user.id) throw new Error("Forbidden");
  return user;
}

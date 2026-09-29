"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/lib/current-user";
import { profiles, resultAccessGrants, users } from "@/db/schema";

export type ProfileState = { ok: boolean; message: string } | null;

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const VISIBILITIES = ["private", "group_members", "public"] as const;

const clean = (v: FormDataEntryValue | null, max: number) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s || null;
};

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const displayName = clean(formData.get("displayName"), 100);
  if (!displayName) return { ok: false, message: "Display name is required." };

  const visibility = String(formData.get("visibility"));
  if (!VISIBILITIES.includes(visibility as (typeof VISIBILITIES)[number])) {
    return { ok: false, message: "Invalid visibility." };
  }

  const values = {
    displayName,
    bio: clean(formData.get("bio"), 1000),
    contactEmail: clean(formData.get("contactEmail"), 200),
    contactPhone: clean(formData.get("contactPhone"), 50),
    visibility: visibility as (typeof VISIBILITIES)[number],
    updatedAt: new Date(),
  };

  const photo = formData.get("photo");
  let photoUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) return { ok: false, message: "Photo must be an image." };
    if (photo.size > MAX_PHOTO_BYTES) return { ok: false, message: "Photo must be under 5 MB." };
    try {
      const client = await clerkClient();
      const updated = await client.users.updateUserProfileImage(user.clerkUserId, { file: photo });
      photoUrl = updated.imageUrl;
    } catch (e) {
      return { ok: false, message: `Photo upload failed: ${(e as Error).message}` };
    }
  }

  await db
    .update(profiles)
    .set({ ...values, ...(photoUrl ? { photoUrl } : {}) })
    .where(eq(profiles.userId, user.id));

  revalidatePath("/profile");
  return { ok: true, message: "Profile saved." };
}

// ---- Per-user consent for assessment results ----

export type ShareState = { ok: boolean; message: string } | null;

export async function grantAccess(_prev: ShareState, formData: FormData): Promise<ShareState> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, message: "Not signed in." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, message: "Enter an email address." };

  const target = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!target || target.status !== "active") return { ok: false, message: "No active account with that email." };
  if (target.id === me.id) return { ok: false, message: "You can already see your own results." };

  await db.insert(resultAccessGrants).values({ ownerId: me.id, viewerId: target.id }).onConflictDoNothing();
  revalidatePath("/profile");
  return { ok: true, message: `${email} can now see your results.` };
}

export async function revokeAccess(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  // Scoped to the caller's own grants: you can only revoke access to your own results.
  await db
    .delete(resultAccessGrants)
    .where(and(eq(resultAccessGrants.id, String(formData.get("grantId"))), eq(resultAccessGrants.ownerId, me.id)));
  revalidatePath("/profile");
}

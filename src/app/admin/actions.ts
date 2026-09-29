"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { users } from "@/db/schema";
import { autoLinkByEmail, linkManually, refreshResults, unlink } from "@/lib/assessment/service";
import { tti } from "@/lib/assessment/tti-client";

export type InviteState = { ok: boolean; message: string } | null;

export async function inviteUser(_prev: InviteState, formData: FormData): Promise<InviteState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  try {
    const client = await clerkClient();
    await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/sign-up`,
      ignoreExisting: true,
    });
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  revalidatePath("/admin");
  return { ok: true, message: `Invitation sent to ${email}.` };
}

export async function revokeInvitation(formData: FormData) {
  await requireAdmin();
  const client = await clerkClient();
  await client.invitations.revokeInvitation(String(formData.get("id")));
  revalidatePath("/admin");
}

// ---- TTI assessment linking ----


export type LinkState = { ok: boolean; message: string } | null;

async function targetUser(formData: FormData) {
  const user = await db.query.users.findFirst({ where: eq(users.id, String(formData.get("userId"))) });
  if (!user) throw new Error("User not found.");
  return user;
}

const fail = (e: unknown): LinkState => ({ ok: false, message: (e as Error).message });

export async function autoLinkUser(_prev: LinkState, formData: FormData): Promise<LinkState> {
  await requireAdmin();
  try {
    const user = await targetUser(formData);
    const outcome = await autoLinkByEmail(user.id, user.email);
    revalidatePath("/admin");
    if (outcome.status === "linked") return { ok: true, message: `Linked to ${outcome.passwd}.` };
    if (outcome.status === "none") return { ok: false, message: "No TTI respondent has this email. Link manually." };
    return {
      ok: false,
      message: `${outcome.candidates.length} respondents share this email (${outcome.candidates
        .map((c) => c.passwd)
        .join(", ")}). Link manually.`,
    };
  } catch (e) {
    return fail(e);
  }
}

export async function manualLinkUser(_prev: LinkState, formData: FormData): Promise<LinkState> {
  await requireAdmin();
  const passwd = String(formData.get("passwd") ?? "").trim();
  if (!passwd) return { ok: false, message: "Enter a respondent ID." };
  try {
    const user = await targetUser(formData);
    const r = await linkManually(user.id, passwd);
    revalidatePath("/admin");
    return { ok: true, message: `Linked to ${r.first_name ?? ""} ${r.last_name ?? ""} (${r.passwd}).` };
  } catch (e) {
    return fail(e);
  }
}

export async function unlinkUser(_prev: LinkState, formData: FormData): Promise<LinkState> {
  await requireAdmin();
  try {
    await unlink((await targetUser(formData)).id);
    revalidatePath("/admin");
    return { ok: true, message: "Unlinked." };
  } catch (e) {
    return fail(e);
  }
}

export async function refreshUserResults(_prev: LinkState, formData: FormData): Promise<LinkState> {
  await requireAdmin();
  try {
    await refreshResults((await targetUser(formData)).id);
    revalidatePath("/admin");
    return { ok: true, message: "Results refreshed." };
  } catch (e) {
    return fail(e);
  }
}

export type SearchState = {
  message?: string;
  results?: { passwd: string; name: string; email: string | null; company: string | null }[];
} | null;

export async function searchTti(_prev: SearchState, formData: FormData): Promise<SearchState> {
  await requireAdmin();
  const q = String(formData.get("q") ?? "").trim();
  if (!q) return { message: "Enter an email or a name." };
  try {
    const found = q.includes("@") ? await tti.respondentsByEmail(q) : await tti.searchRespondentsByName(q);
    if (found.length === 0) return { message: "No matches." };
    return {
      results: found.slice(0, 25).map((r) => ({
        passwd: r.passwd,
        name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
        email: r.email,
        company: r.company,
      })),
    };
  } catch (e) {
    return { message: (e as Error).message };
  }
}

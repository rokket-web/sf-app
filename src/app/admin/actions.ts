"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { assessmentLinks, profiles, users } from "@/db/schema";
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

export type SearchResult = {
  passwd: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string | null;
  company: string | null;
  status: "available" | "user" | "linked" | "invited";
};

export type SearchState = { message?: string; results?: SearchResult[] } | null;

export async function searchTti(_prev: SearchState, formData: FormData): Promise<SearchState> {
  await requireAdmin();
  const q = String(formData.get("q") ?? "").trim();
  if (!q) return { message: "Enter an email or a name." };
  try {
    const found = (q.includes("@") ? await tti.respondentsByEmail(q) : await tti.searchRespondentsByName(q)).slice(0, 25);
    if (found.length === 0) return { message: "No matches." };

    const [existingUsers, links, invites] = await Promise.all([
      db.select({ email: users.email }).from(users),
      db.select({ passwd: assessmentLinks.ttiExternalId }).from(assessmentLinks),
      clerkClient().then((c) => c.invitations.getInvitationList({ status: "pending", limit: 500 })),
    ]);
    const userEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const linked = new Set(links.map((l) => l.passwd));
    const invited = new Set(invites.data.map((i) => i.emailAddress.toLowerCase()));

    return {
      results: found.map((r) => {
        const email = r.email?.trim().toLowerCase() ?? null;
        const status: SearchResult["status"] = linked.has(r.passwd)
          ? "linked"
          : email && userEmails.has(email)
            ? "user"
            : email && invited.has(email)
              ? "invited"
              : "available";
        return {
          passwd: r.passwd,
          name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
          firstName: r.first_name ?? "",
          lastName: r.last_name ?? "",
          email: r.email,
          company: r.company,
          status,
        };
      }),
    };
  } catch (e) {
    return { message: (e as Error).message };
  }
}

type TtiCandidate = { passwd: string; email: string; displayName: string; firstName: string; lastName: string };

// Shared checks for both "Add to Users" and "Invite via email". Runs on the server every time.
async function loadCandidate(formData: FormData): Promise<TtiCandidate> {
  const passwd = String(formData.get("passwd") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!passwd) throw new Error("Missing respondent ID.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");

  const respondent = await tti.respondent(passwd);
  if (await db.query.assessmentLinks.findFirst({ where: eq(assessmentLinks.ttiExternalId, respondent.passwd) })) {
    throw new Error("That TTI respondent is already linked to a user.");
  }
  if (await db.query.users.findFirst({ where: eq(users.email, email) })) {
    throw new Error("That email already has an account. Use Auto-link on their user row instead.");
  }
  const firstName = respondent.first_name ?? "";
  const lastName = respondent.last_name ?? "";
  return { passwd: respondent.passwd, email, firstName, lastName, displayName: `${firstName} ${lastName}`.trim() };
}

// One entry point for the two buttons on a TTI search result (button `name="intent"`).
export async function submitTtiUser(_prev: LinkState, formData: FormData): Promise<LinkState> {
  await requireAdmin();
  const intent = String(formData.get("intent"));
  try {
    const c = await loadCandidate(formData);
    if (intent === "add") return await addToUsers(c);
    if (intent === "invite") return await inviteViaEmail(c);
    return { ok: false, message: "Unknown action." };
  } catch (e) {
    return fail(e);
  }
}

// Invite via email: sends the app invitation and remembers which TTI respondent they are,
// so their assessment is linked automatically when they first sign in.
async function inviteViaEmail(c: TtiCandidate): Promise<LinkState> {
  const client = await clerkClient();
  await client.invitations.createInvitation({
    emailAddress: c.email,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/sign-up`,
    ignoreExisting: true,
    publicMetadata: { ttiRespondentId: c.passwd, displayName: c.displayName },
  });
  revalidatePath("/admin");
  return { ok: true, message: `Invitation sent to ${c.email}. Their TTI results link automatically when they sign up.` };
}

// Add to Users: creates the account right now (no email is sent), links the TTI respondent
// and pulls their results, so they show up under Current users immediately.
async function addToUsers(c: TtiCandidate): Promise<LinkState> {
  const client = await clerkClient();
  const clerkUser = await client.users.createUser({
    emailAddress: [c.email],
    firstName: c.firstName || undefined,
    lastName: c.lastName || undefined,
    skipPasswordRequirement: true,
    publicMetadata: { ttiRespondentId: c.passwd },
  });

  let userId: string;
  try {
    const [created] = await db.insert(users).values({ clerkUserId: clerkUser.id, email: c.email }).returning();
    userId = created.id;
    await db.insert(profiles).values({ userId, displayName: c.displayName || c.email });
    await linkManually(userId, c.passwd);
  } catch (e) {
    // Don't leave a half-created account behind.
    await client.users.deleteUser(clerkUser.id).catch(() => {});
    await db.delete(users).where(eq(users.clerkUserId, clerkUser.id)).catch(() => {});
    throw e;
  }

  let note = "Results imported.";
  try {
    await refreshResults(userId);
  } catch (e) {
    note = `Linked, but results weren't imported yet (${(e as Error).message}). Use Refresh results on their row.`;
  }
  revalidatePath("/admin");
  return { ok: true, message: `${c.displayName || c.email} added. ${note}` };
}

"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/drizzle";
import { getCurrentUser } from "@/lib/current-user";
import { refreshResults } from "@/lib/assessment/service";
import { assessmentLinks, assessmentResults } from "@/db/schema";

export type RefreshState = { ok: boolean; message: string } | null;

const COOLDOWN_MS = 10 * 60 * 1000;

export async function refreshMyResults(): Promise<RefreshState> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, message: "Not signed in." };

  // TTI allows 100 requests/min across the whole app, so limit manual refreshes per user.
  const link = await db.query.assessmentLinks.findFirst({ where: eq(assessmentLinks.userId, me.id) });
  const cached = link
    ? await db.query.assessmentResults.findFirst({ where: eq(assessmentResults.linkId, link.id) })
    : undefined;
  if (cached && Date.now() - cached.fetchedAt.getTime() < COOLDOWN_MS) {
    return { ok: false, message: "Your results were refreshed a moment ago. Try again in a few minutes." };
  }

  try {
    await refreshResults(me.id);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  revalidatePath("/results");
  return { ok: true, message: "Results updated." };
}

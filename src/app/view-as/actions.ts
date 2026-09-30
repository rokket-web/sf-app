"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { getRealUser, impersonationEnabled, VIEW_AS_COOKIE } from "@/lib/current-user";
import { users } from "@/db/schema";

// Only a real, active admin can switch, and only when ALLOW_IMPERSONATION=true.
async function realAdmin() {
  if (!impersonationEnabled()) throw new Error("Impersonation is disabled.");
  const me = await getRealUser();
  if (!me?.isAdmin || me.status !== "active") throw new Error("Forbidden");
  return me;
}

export async function startViewAs(formData: FormData) {
  const me = await realAdmin();
  const id = String(formData.get("userId") ?? "");
  if (!id || id === me.id) return;

  const target = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!target || target.status !== "active") return;

  (await cookies()).set(VIEW_AS_COOKIE, target.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  console.info(`[view-as] admin ${me.email} is now viewing as ${target.email}`);
  redirect("/landing");
}

export async function stopViewAs() {
  await realAdmin();
  (await cookies()).delete(VIEW_AS_COOKIE);
  redirect("/admin");
}

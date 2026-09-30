import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { getCurrentUser, getRealUser, getViewAs, impersonationEnabled } from "@/lib/current-user";
import { users } from "@/db/schema";
import { stopViewAs } from "@/app/view-as/actions";
import { ViewAsPicker } from "./view-as-picker";

export async function Nav() {
  const real = await getRealUser();
  const viewAs = await getViewAs(real);
  const user = await getCurrentUser();

  // The switcher is for real admins only, and only when ALLOW_IMPERSONATION=true.
  const canSwitch = impersonationEnabled() && !!real?.isAdmin;
  const others =
    canSwitch && !viewAs && real
      ? (
          await db.query.users.findMany({
            where: and(eq(users.status, "active"), ne(users.id, real.id)),
            with: { profile: true },
          })
        )
          .map((u) => ({ id: u.id, label: u.profile?.displayName ?? u.email }))
          .sort((a, b) => a.label.localeCompare(b.label))
      : [];

  return (
    <>
      {viewAs && (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-amber-400 px-4 py-1.5 text-sm text-black">
          <span>
            Viewing as <strong>{viewAs.target.profile?.displayName ?? viewAs.target.email}</strong> (you are signed in as{" "}
            {viewAs.real.email})
          </span>
          <form action={stopViewAs}>
            <button className="rounded bg-black px-2 py-0.5 text-white">Switch back to admin</button>
          </form>
        </div>
      )}
      <header className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-2 sm:px-6 sm:py-3 dark:border-white/20">
        <Link href="/" className="font-semibold">
          SF App
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-1 text-sm sm:gap-x-4 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center [&>a]:px-2 sm:[&>a]:px-0">
          {user && <Link href="/groups">Groups</Link>}
          {user && <Link href="/compare">Compare</Link>}
          {user && <Link href="/profile">Profile</Link>}
          {user?.isAdmin && <Link href="/admin">Admin</Link>}
          {others.length > 0 && <ViewAsPicker users={others} />}
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in">Sign in</Link>
          </Show>
        </nav>
      </header>
    </>
  );
}

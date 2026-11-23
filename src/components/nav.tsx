import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { getCurrentUser, getRealUser, getViewAs, impersonationEnabled } from "@/lib/current-user";
import { users } from "@/db/schema";
import { stopViewAs } from "@/app/view-as/actions";
import { ViewAsPicker } from "./view-as-picker";
import { NavDrawer } from "./nav-drawer";

const ICONS = {
  results: <path d="M3 3v18h18M7 15v3M12 9v9M17 5v13" />,
  groups: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  compare: <path d="M17 3l4 4-4 4M21 7H8M7 21l-4-4 4-4M3 17h13" />,
  profile: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  admin: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  signin: <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />,
};

function NavLink({ href, icon, children }: { href: string; icon: keyof typeof ICONS; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0"
      >
        {ICONS[icon]}
      </svg>
      {children}
    </Link>
  );
}

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
            <button className="rounded bg-primary px-2 py-0.5 text-white hover:brightness-110">Switch back to admin</button>
          </form>
        </div>
      )}
      <header className="flex items-center justify-between gap-3 border-b-4 border-accent bg-primary px-4 py-2 text-white sm:px-6 sm:py-3">
        <Link href="/" className="font-semibold !text-white">
          OXYGEN
        </Link>
        <NavDrawer>
          {user && !user.isAdmin && (
            <>
              <NavLink href="/results" icon="results">My Results</NavLink>
              <NavLink href="/groups" icon="groups">Groups</NavLink>
              <NavLink href="/profile" icon="settings">Settings</NavLink>
            </>
          )}
          {user?.isAdmin && (
            <>
              <NavLink href="/groups" icon="groups">Groups</NavLink>
              <NavLink href="/compare" icon="compare">Compare</NavLink>
              <NavLink href="/profile" icon="profile">Profile</NavLink>
              <NavLink href="/admin" icon="admin">Admin</NavLink>
            </>
          )}
          {others.length > 0 && <ViewAsPicker users={others} />}
          <Show when="signed-in">
            <div className="px-2 py-2">
              <UserButton />
            </div>
          </Show>
          <Show when="signed-out">
            <NavLink href="/sign-in" icon="signin">Sign in</NavLink>
          </Show>
        </NavDrawer>
      </header>
    </>
  );
}

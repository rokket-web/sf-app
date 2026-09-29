import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/current-user";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/20">
      <Link href="/" className="font-semibold">
        SF App
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {user && <Link href="/groups">Groups</Link>}
        {user && <Link href="/compare">Compare</Link>}
        {user && <Link href="/profile">Profile</Link>}
        {user?.isAdmin && <Link href="/admin">Admin</Link>}
        <Show when="signed-in">
          <UserButton />
        </Show>
        <Show when="signed-out">
          <Link href="/sign-in">Sign in</Link>
        </Show>
      </nav>
    </header>
  );
}

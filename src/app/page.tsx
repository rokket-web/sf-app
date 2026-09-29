import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-6">
      <h1 className="text-2xl font-semibold">SF App</h1>
      {user ? (
        <p>
          Welcome back. <Link href="/profile" className="underline">Edit your profile</Link>.
        </p>
      ) : (
        <p>
          This app is invite-only. <Link href="/sign-in" className="underline">Sign in</Link> to continue.
        </p>
      )}
    </main>
  );
}

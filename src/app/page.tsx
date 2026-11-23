import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export default async function Home() {
  // Signed-in users land on their compass.
  if (await getCurrentUser()) redirect("/landing");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-6">
      <h1 className="text-2xl font-semibold">OXYGEN</h1>
      <p>
        This app is invite-only. <Link href="/sign-in" className="underline">Sign in</Link> to continue.
      </p>
    </main>
  );
}

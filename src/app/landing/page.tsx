import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getDiscResults } from "@/lib/assessment/access";
import { compassPoint } from "../results/compass";
import { CompassGraphic } from "../results/compass-graphic";

// Post-login landing: the signed-in user's own compass, centred on the page.
export default async function Landing() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const outcome = await getDiscResults(user.id, user.id);
  const natural = outcome.status === "ok" ? compassPoint(outcome.disc.wheelPos.natural) : undefined;
  const adapted = outcome.status === "ok" ? compassPoint(outcome.disc.wheelPos.adapted) : undefined;

  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center gap-4 p-6">
      {natural ? (
        <>
          {/* The compass art is dark on transparent, so it sits on a white card to stay readable in dark mode. */}
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 text-[#111] shadow-sm">
            <CompassGraphic natural={natural} adapted={adapted} />
          </div>
          <p className="text-center text-sm opacity-70">
            Natural style: <strong>{natural.label}</strong>
            {adapted && adapted.key !== natural.key && (
              <>
                {" "}
                · Adapted style: <strong>{adapted.label}</strong>
              </>
            )}
          </p>
          <Link href="/results" className="min-h-11 content-center text-sm underline">
            View my full report
          </Link>
        </>
      ) : (
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Welcome</h1>
          <p className="text-sm opacity-80">
            {outcome.status === "not_linked"
              ? "Your assessment isn't linked yet, so there's no compass to show. Ask an admin to link your assessment."
              : outcome.status === "unavailable"
                ? `Your compass isn't available right now. ${outcome.reason}`
                : "Your compass isn't available yet."}
          </p>
          <Link href={user.isAdmin ? "/admin" : "/groups"} className="inline-block min-h-11 content-center text-sm underline">
            Continue
          </Link>
        </div>
      )}
    </main>
  );
}

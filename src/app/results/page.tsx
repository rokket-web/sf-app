import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getDiscResults, getMyReportSections } from "@/lib/assessment/access";
import type { DiscScores } from "@/lib/assessment/types";
import { RefreshButton } from "./refresh-button";
import { ReportSections } from "./report-sections";

const FACTORS = [
  { key: "d", label: "Dominance", blurb: "Direct, results-driven, decisive" },
  { key: "i", label: "Influence", blurb: "Outgoing, enthusiastic, persuasive" },
  { key: "s", label: "Steadiness", blurb: "Patient, consistent, supportive" },
  { key: "c", label: "Compliance", blurb: "Analytical, precise, careful" },
] as const;

export default async function ResultsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");

  const outcome = await getDiscResults(me.id, me.id);

  if (outcome.status !== "ok") {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-6">
        <BackLink />
        <h1 className="text-2xl font-semibold">My assessment results</h1>
        <p>
          {outcome.status === "not_linked"
            ? "Your assessment isn't linked yet. Ask an admin to link your TTI account."
            : outcome.status === "unavailable"
              ? `Your results aren't available right now. ${outcome.reason}`
              : "Not available."}
        </p>
      </main>
    );
  }

  const { disc } = outcome;
  const sections = await getMyReportSections(me.id);
  const get = (s: DiscScores, k: (typeof FACTORS)[number]["key"]) => s[k];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 p-6">
      <div className="space-y-2">
        <BackLink />
        <h1 className="text-2xl font-semibold">My assessment results</h1>
        <p className="text-sm opacity-70">
          Report dated {disc.reportDate ? new Date(disc.reportDate).toLocaleDateString() : "unknown"} · last synced{" "}
          {disc.fetchedAt.toLocaleDateString()}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <a href="/api/my-report" target="_blank" rel="noopener" className="rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black">
            Open full PDF report
          </a>
          <RefreshButton />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">DISC scores</h2>
        <p className="text-sm opacity-70">
          <strong>Natural</strong> is how you behave when you are being yourself. <strong>Adapted</strong> is how you
          behave in your current environment.
        </p>
        <ul className="flex flex-wrap gap-4 text-sm">
          <li className="flex items-center gap-2">
            <span className="size-3 rounded-sm" style={{ background: "var(--series-1)" }} />
            Natural
          </li>
          <li className="flex items-center gap-2">
            <span className="size-3 rounded-sm" style={{ background: "var(--series-2)" }} />
            Adapted
          </li>
        </ul>
        <div className="space-y-4">
          {FACTORS.map((f) => (
            <div key={f.key} className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{f.label}</span>
                <span className="text-xs opacity-60">{f.blurb}</span>
              </div>
              {[
                { label: "Natural", value: get(disc.natural, f.key), color: "var(--series-1)" },
                { label: "Adapted", value: get(disc.adapted, f.key), color: "var(--series-2)" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2" title={`${b.label} ${f.label}: ${b.value}`}>
                  <div className="h-4 flex-1 rounded-sm bg-black/5 dark:bg-white/10">
                    <div
                      className="h-full rounded-r-[4px]"
                      style={{ width: `${Math.max(0, Math.min(100, b.value))}%`, background: b.color }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm tabular-nums">{b.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer">View as table</summary>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/20">
                <th className="py-1">Factor</th>
                <th>Natural</th>
                <th>Adapted</th>
              </tr>
            </thead>
            <tbody>
              {FACTORS.map((f) => (
                <tr key={f.key} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-1">{f.label}</td>
                  <td>{get(disc.natural, f.key)}</td>
                  <td>{get(disc.adapted, f.key)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">TTI graphs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Natural style", src: disc.graphs.natural },
            { title: "Adapted style", src: disc.graphs.adapted },
            { title: "Success Insights® wheel", src: disc.graphs.wheel },
          ]
            .filter((g) => g.src)
            .map((g) => (
              <figure key={g.title} className="space-y-1 rounded border border-black/10 bg-white p-2 dark:border-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={`${g.title} DISC graph`} className="mx-auto w-full" />
                <figcaption className="text-center text-sm text-black/70">{g.title}</figcaption>
              </figure>
            ))}
        </div>
      </section>

      <section className="space-y-6 border-t border-black/10 pt-8 dark:border-white/20">
        <h2 className="text-xl font-semibold">Your full report</h2>
        {sections?.length ? (
          <ReportSections sections={sections} />
        ) : (
          <p className="text-sm opacity-70">
            The written report isn&apos;t available right now. Try &ldquo;Refresh from TTI&rdquo;, or open the PDF above.
          </p>
        )}
      </section>
    </main>
  );
}

function BackLink() {
  return (
    <Link href="/profile" className="text-sm underline">
      ← Profile
    </Link>
  );
}

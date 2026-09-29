import type { DiscView } from "@/lib/assessment/access";
import type { DiscScores } from "@/lib/assessment/types";

const FACTORS = [
  { key: "d", label: "Dominance" },
  { key: "i", label: "Influence" },
  { key: "s", label: "Steadiness" },
  { key: "c", label: "Compliance" },
] as const;

type Person = { name: string; disc: DiscView };

function StyleChart({ title, style, you, them }: { title: string; style: "natural" | "adapted"; you: Person; them: Person }) {
  const rows = FACTORS.map((f) => ({
    ...f,
    you: you.disc[style][f.key as keyof DiscScores],
    them: them.disc[style][f.key as keyof DiscScores],
  }));

  return (
    <section className="space-y-3">
      <h3 className="font-medium">{title}</h3>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.key} className="space-y-1">
            <div className="text-sm opacity-70">{r.label}</div>
            {[
              { who: "You", value: r.you, color: "var(--series-1)" },
              { who: them.name, value: r.them, color: "var(--series-2)" },
            ].map((b) => (
              <div key={b.who} className="flex items-center gap-2" title={`${b.who}: ${b.value} (${r.label}, ${style})`}>
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
    </section>
  );
}

function Legend({ you, them }: { you: string; them: string }) {
  return (
    <ul className="flex flex-wrap gap-4 text-sm">
      <li className="flex items-center gap-2">
        <span className="size-3 rounded-sm" style={{ background: "var(--series-1)" }} />
        {you}
      </li>
      <li className="flex items-center gap-2">
        <span className="size-3 rounded-sm" style={{ background: "var(--series-2)" }} />
        {them}
      </li>
    </ul>
  );
}

function GraphPair({ title, a, b, nameA, nameB }: { title: string; a?: string; b?: string; nameA: string; nameB: string }) {
  if (!a && !b) return null;
  return (
    <section className="space-y-2">
      <h3 className="font-medium">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { src: a, name: nameA },
          { src: b, name: nameB },
        ].map((g) => (
          <figure key={g.name} className="space-y-1 rounded border border-black/10 bg-white p-2 dark:border-white/20">
            {g.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.src} alt={`${title} graph for ${g.name}`} className="mx-auto w-full" />
            ) : (
              <p className="p-4 text-sm text-black/60">Graph unavailable</p>
            )}
            <figcaption className="text-center text-sm text-black/70">{g.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function DiscCompare({ you, them }: { you: Person; them: Person }) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">DISC scores</h2>
        <Legend you="You" them={them.name} />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <StyleChart title="Natural style" style="natural" you={you} them={them} />
        <StyleChart title="Adapted style" style="adapted" you={you} them={them} />
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer">View as table</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/20">
              <th className="py-1">Style</th>
              <th>Factor</th>
              <th>You</th>
              <th>{them.name}</th>
            </tr>
          </thead>
          <tbody>
            {(["natural", "adapted"] as const).flatMap((style) =>
              FACTORS.map((f) => (
                <tr key={`${style}-${f.key}`} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-1 capitalize">{style}</td>
                  <td>{f.label}</td>
                  <td>{you.disc[style][f.key as keyof DiscScores]}</td>
                  <td>{them.disc[style][f.key as keyof DiscScores]}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </details>

      <div className="space-y-8">
        <h2 className="text-lg font-semibold">TTI graphs</h2>
        <GraphPair title="Natural style" a={you.disc.graphs.natural} b={them.disc.graphs.natural} nameA="You" nameB={them.name} />
        <GraphPair title="Adapted style" a={you.disc.graphs.adapted} b={them.disc.graphs.adapted} nameA="You" nameB={them.name} />
        <GraphPair title="Success Insights® wheel" a={you.disc.graphs.wheel} b={them.disc.graphs.wheel} nameA="You" nameB={them.name} />
      </div>
    </div>
  );
}

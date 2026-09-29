import type { TtiReportSection } from "@/lib/assessment/types";

const titleCase = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/(^|[\s"(])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : []);

function Heading({ children }: { children: string }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}

function Section({ section }: { section: TtiReportSection }) {
  const title = titleCase(section.header?.titles?.[0] ?? "");

  switch (section.type) {
    case "GENCHAR": {
      const paras = (section.statements ?? []).flatMap((s) => strings(s.stmts));
      if (!paras.length) return null;
      return (
        <section className="space-y-2">
          <Heading>{title || "Personality insights"}</Heading>
          {paras.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      );
    }

    case "WANT":
    case "RSTR":
    case "DO":
    case "DONT":
    case "ADSTY": {
      const items = (section.statements ?? []).flatMap((s) => strings(s.stmts));
      if (!items.length) return null;
      return (
        <section className="space-y-2">
          <Heading>{title}</Heading>
          {section.prefix && <p className="text-sm opacity-70">{section.prefix}</p>}
          <ul className="list-disc space-y-1 pl-6">
            {items.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      );
    }

    case "PERCEPT": {
      const lists = (section.wordlists ?? []).filter((w) => strings(w.words).length);
      if (!lists.length) return null;
      return (
        <section className="space-y-2">
          <Heading>{title || "Perceptions"}</Heading>
          {section.header?.text && <p className="text-sm opacity-70">{section.header.text}</p>}
          <div className="grid gap-4 sm:grid-cols-3">
            {lists.map((w, i) => (
              <div key={i} className="space-y-1 rounded border border-black/10 p-3 dark:border-white/20">
                <div className="text-sm font-medium">{titleCase(w.title ?? "")}</div>
                {w.prefix && <div className="text-xs opacity-60">{w.prefix}</div>}
                <ul className="flex flex-wrap gap-1 pt-1">
                  {strings(w.words).map((word) => (
                    <li key={word} className="rounded bg-black/5 px-2 py-0.5 text-sm dark:bg-white/10">
                      {word}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "NASTYLE": {
      const styles = (section.styles ?? []).filter(
        (s) => strings(s.natural?.statements).length || strings(s.adapted?.statements).length,
      );
      if (!styles.length) return null;
      return (
        <section className="space-y-3">
          <Heading>{title || "Core and adapted style"}</Heading>
          {section.header?.text && <p className="text-sm opacity-70">{section.header.text}</p>}
          <div className="space-y-4">
            {styles.map((s, i) => (
              <div key={s.ident ?? i} className="space-y-2">
                <div className="font-medium">{titleCase(s.title ?? "")}</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["Natural", s.natural, "var(--series-1)"],
                      ["Adapted", s.adapted, "var(--series-2)"],
                    ] as const
                  ).map(([label, block, color]) => (
                    <div key={label} className="space-y-1 border-l-4 pl-3" style={{ borderColor: color }}>
                      <div className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</div>
                      {strings(block?.statements).map((t, j) => (
                        <p key={j} className="text-sm">
                          {t}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    default:
      // TITLE, intro, compass and resources sections are graphics or boilerplate; the PDF has them.
      return null;
  }
}

export function ReportSections({ sections }: { sections: TtiReportSection[] }) {
  return (
    <div className="space-y-8">
      {sections.map((s, i) => (
        <Section key={`${s.type}-${i}`} section={s} />
      ))}
    </div>
  );
}

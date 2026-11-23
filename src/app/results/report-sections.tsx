import type { TtiReportSection } from "@/lib/assessment/types";
import { BLUE, PageTitle, ReportPage, headingFont } from "./report-page";

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];

const titleOf = (s: TtiReportSection, fallback = "") => (s.header?.titles?.[0] ?? "").trim() || fallback;

function Intro({ text }: { text?: string }) {
  return text ? <p className="text-sm italic text-[#333]">{text}</p> : null;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 pl-6 text-sm marker:text-[#00a8e1] [&>li]:list-disc">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function Section({ section, name }: { section: TtiReportSection; name: string }) {
  switch (section.type) {
    case "GENCHAR": {
      const paras = (section.statements ?? []).flatMap((s) => strings(s.stmts));
      if (!paras.length) return null;
      return (
        <ReportPage name={name}>
          <PageTitle>{titleOf(section, "Personality insights")}</PageTitle>
          <Intro text={section.header?.text} />
          <div className="space-y-4 text-sm leading-relaxed">
            {paras.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </ReportPage>
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
        <ReportPage name={name}>
          <PageTitle>{titleOf(section)}</PageTitle>
          <Intro text={section.header?.text} />
          {section.prefix && (
            <p className="text-sm font-bold" style={{ color: BLUE }}>
              {section.prefix}
            </p>
          )}
          <Bullets items={items} />
        </ReportPage>
      );
    }

    case "PERCEPT": {
      const lists = (section.wordlists ?? []).filter((w) => strings(w.words).length);
      if (!lists.length) return null;
      // Consecutive lists with the same title (e.g. "OTHERS' PERCEPTION") share one heading.
      return (
        <ReportPage name={name}>
          <PageTitle>{titleOf(section, "Perceptions")}</PageTitle>
          <Intro text={section.header?.text} />
          <div className="space-y-4">
            {lists.map((w, i) => (
              <div key={i} className="space-y-2">
                {w.title && w.title !== lists[i - 1]?.title && (
                  <h3 className={`${headingFont.className} border-b pb-0.5 text-xl font-medium uppercase`} style={{ color: BLUE, borderColor: BLUE }}>
                    {w.title}
                  </h3>
                )}
                {w.prefix && <p className="text-sm font-bold">{w.prefix}</p>}
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2 pl-6 text-sm marker:text-[#00a8e1] [&>li]:list-disc">
                  {strings(w.words).map((word) => (
                    <li key={word}>{word}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ReportPage>
      );
    }

    case "NASTYLE": {
      const styles = (section.styles ?? []).filter(
        (s) => strings(s.natural?.statements).length || strings(s.adapted?.statements).length,
      );
      if (!styles.length) return null;
      return (
        <ReportPage name={name}>
          <PageTitle>{titleOf(section, "Core and adapted style")}</PageTitle>
          <Intro text={section.header?.text} />
          <div className="space-y-4">
            {styles.map((s, i) => (
              <div key={s.ident ?? i}>
                <div
                  className={`${headingFont.className} grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 border-t pt-1 text-sm font-medium uppercase`}
                  style={{ color: BLUE, borderColor: BLUE }}
                >
                  <span>Core style</span>
                  <span className="text-center text-base font-bold">{(s.title ?? "").trim()}</span>
                  <span className="text-right">Adapted style</span>
                </div>
                <div className="mt-1 grid grid-cols-2 text-sm leading-snug">
                  <div className="space-y-2 border-r pr-3" style={{ borderColor: BLUE }}>
                    {strings(s.natural?.statements).map((t, j) => (
                      <p key={j}>{t}</p>
                    ))}
                  </div>
                  <div className="space-y-2 pl-3">
                    {strings(s.adapted?.statements).map((t, j) => (
                      <p key={j}>{t}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ReportPage>
      );
    }

    default:
      // TITLE, OXYGEN_INTRO, OXYGEN_COMPASS and OXYGEN_RESOURCES carry no content: they are rendered as fixed pages.
      return null;
  }
}

export function ReportSections({ sections, name }: { sections: TtiReportSection[]; name: string }) {
  return (
    <>
      {sections.map((s, i) => (
        <Section key={`${s.type}-${i}`} section={s} name={name} />
      ))}
    </>
  );
}

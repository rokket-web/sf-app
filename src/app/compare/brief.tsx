import type { DiscView } from "@/lib/assessment/access";
import type { TtiReportSection } from "@/lib/assessment/types";
import { CONTENT_IS_PLACEHOLDER, PAIRING_COPY, STYLE_COPY, adaptationCopy } from "@/lib/brief/content";
import { SECTORS, adaptationLoad, pairing, styleProfile, type StyleKey, type StyleProfile } from "@/lib/brief/style";

type Person = { name: string; disc: DiscView };

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

function Section({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "them" }) {
  return (
    <section className={`space-y-3 border-t border-black/10 px-4 py-5 sm:px-5 dark:border-white/15 ${tone === "them" ? "bg-them-tint" : ""}`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider ${tone === "them" ? "text-them" : "opacity-70"}`}>{title}</h3>
      {children}
    </section>
  );
}

function Callout({ label, children, tone = "you" }: { label: string; children: React.ReactNode; tone?: "you" | "strain" }) {
  return (
    <div className={`rounded-2xl p-4 text-[15px] leading-relaxed ${tone === "strain" ? "bg-background" : "bg-you-tint"}`}>
      <div className={`mb-1 text-xs font-bold uppercase tracking-wide ${tone === "strain" ? "text-strain" : "text-you"}`}>{label}</div>
      {children}
    </div>
  );
}

// Label positions around the compass, in the 440x340 viewBox. Order matches SECTORS.
const SECTOR_LABEL_POS: Record<(typeof SECTORS)[number], { x: number; y: number }> = {
  Efficient: { x: 220, y: 58 },
  Driven: { x: 298, y: 90 },
  Persuasive: { x: 330, y: 170 },
  Relational: { x: 298, y: 250 },
  "Peace Keeping": { x: 220, y: 284 },
  Steady: { x: 142, y: 250 },
  Coordinating: { x: 110, y: 170 },
  Accurate: { x: 142, y: 90 },
};

const CX = 220;
const CY = 170;
const R = 120;

function Compass({ you, them }: { you: StyleProfile; them: StyleProfile }) {
  const pt = (p: StyleProfile) => ({ x: CX + p.axes.x * R, y: CY - p.axes.y * R });
  const a = pt(you);
  const b = pt(them);
  // Put each name on the side away from the other dot so labels don't collide.
  const youLeft = a.x <= b.x;

  return (
    <svg
      viewBox="0 0 440 340"
      className="mx-auto w-full max-w-[400px]"
      role="img"
      aria-label={`Compass. You: ${you.sector}, ${you.orientation.toLowerCase()}, ${you.pace.toLowerCase()}. Them: ${them.sector}, ${them.orientation.toLowerCase()}, ${them.pace.toLowerCase()}.`}
    >
      <g fill="none" stroke="currentColor" strokeOpacity="0.2">
        <circle cx={CX} cy={CY} r={R} />
        <circle cx={CX} cy={CY} r={R / 2} />
        <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} />
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} />
      </g>
      <g fontSize="14" fontWeight="700" fill="currentColor" opacity="0.7">
        <text x={CX} y="20" textAnchor="middle">TASK-ORIENTED</text>
        <text x={CX} y="322" textAnchor="middle">PEOPLE-ORIENTED</text>
        <text x="10" y="148" textAnchor="start">SLOWER</text>
        <text x="430" y="148" textAnchor="end">FASTER</text>
      </g>
      <g fontSize="14" textAnchor="middle">
        {SECTORS.map((s) => {
          const mark = you.sector === s ? "var(--you)" : them.sector === s ? "var(--them)" : undefined;
          return (
            <text
              key={s}
              {...SECTOR_LABEL_POS[s]}
              fill={mark ?? "currentColor"}
              fontWeight={mark ? 700 : 400}
              opacity={mark ? 1 : 0.85}
            >
              {s}
            </text>
          );
        })}
      </g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--them)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      <circle cx={a.x} cy={a.y} r="10" fill="var(--you)" />
      <circle cx={b.x} cy={b.y} r="10" fill="var(--them)" />
      <g fontSize="15" fontWeight="700">
        <text x={a.x} y={a.y + 28} textAnchor={youLeft ? "end" : "start"} fill="var(--you)">You</text>
        <text x={b.x} y={b.y + 28} textAnchor={youLeft ? "start" : "end"} fill="var(--them)">Them</text>
      </g>
    </svg>
  );
}

function Legend({ items }: { items: { color: string; text: string }[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] opacity-90">
      {items.map((i) => (
        <li key={i.text} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: i.color }} />
          {i.text}
        </li>
      ))}
    </ul>
  );
}

// A track with one or two labelled markers. `value` is 0-100.
function Track({ markers, left, right }: { markers: { value: number; color: string; label: string }[]; left: string; right: string }) {
  const ordered = [...markers].sort((a, b) => a.value - b.value);
  return (
    <div>
      <div className="relative h-8" aria-hidden>
        <div className="absolute inset-x-0 top-[13px] h-2 rounded-full bg-black/10 dark:bg-white/15" />
        {ordered.map((m) => (
          <div
            key={m.label}
            className="absolute top-0 h-[18px] w-[3px] -translate-x-1/2 rounded-full"
            style={{ left: `${m.value}%`, background: m.color }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs opacity-70">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <div className="mt-1.5 flex justify-between text-[13px] font-semibold">
        {ordered.map((m) => (
          <span key={m.label} style={{ color: m.color }}>
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PaceGap({ you, them, name }: { you: StyleProfile; them: StyleProfile; name: string }) {
  const copy = PAIRING_COPY[pairing(you, them)];
  return (
    <Section title="Pace gap">
      <p className="text-[15px]">{copy.summary}</p>
      <Track
        left="Slower"
        right="Faster"
        markers={[
          { value: you.paceScore, color: "var(--you)", label: `You · ${you.paceScore}` },
          { value: them.paceScore, color: "var(--them)", label: `${firstName(name)} · ${them.paceScore}` },
        ]}
      />
    </Section>
  );
}

function AdaptationLoadSection({ person }: { person: Person }) {
  const load = adaptationLoad(person.disc.natural, person.disc.adapted);
  const name = firstName(person.name);
  return (
    <Section title={`Adaptation load — ${name}, right now`} tone="them">
      <p className="text-[15px]">Pace: natural style versus current environment</p>
      <Track
        left="Slower"
        right="Faster"
        markers={[
          { value: load.naturalPace, color: "var(--you)", label: `Natural · ${load.naturalPace}` },
          { value: load.currentPace, color: "var(--strain)", label: `Right now · ${load.currentPace}` },
        ]}
      />
      <table className="w-full text-[13px]">
        <caption className="sr-only">Natural and current DISC scores for {person.name}</caption>
        <thead className="text-left opacity-70">
          <tr>
            <th className="py-1.5 font-medium">Factor</th>
            <th className="font-medium">Natural</th>
            <th className="font-medium">Now</th>
            <th className="text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {load.factors.map((f) => (
            <tr key={f.key} className="border-t border-black/10 dark:border-white/15">
              <td className="py-2">{f.label}</td>
              <td>{f.natural}</td>
              <td>{f.current}</td>
              <td className={`text-right ${Math.abs(f.delta) >= 16 ? "font-semibold text-strain" : ""}`}>
                {f.delta > 0 ? "+" : ""}
                {f.delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Callout label="Why this matters" tone="strain">
        {adaptationCopy(load)}
      </Callout>
    </Section>
  );
}

const normalize = (s: string) => s.trim().toLowerCase();
const words = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : []);

// The TTI "perceptions" lists (how others may see them under moderate and extreme strain).
function strainWords(sections: TtiReportSection[] | null) {
  const lists = (sections ?? []).filter((s) => s.type === "PERCEPT").flatMap((s) => s.wordlists ?? []);
  const find = (re: RegExp) => lists.find((l) => re.test(`${l.title ?? ""} ${l.ident ?? ""}`));
  const moderate = words(find(/moderate/i)?.words);
  const extreme = words(find(/extreme/i)?.words);
  return { moderate, extreme };
}

function Escalation({ sections }: { sections: TtiReportSection[] | null }) {
  const { moderate, extreme } = strainWords(sections);
  if (!moderate.length && !extreme.length) return null;
  return (
    <Section title="Watch for — escalation signals">
      <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
        {moderate.length > 0 && (
          <div className="rounded-xl bg-black/5 p-3.5 dark:bg-white/10">
            <h4 className="mb-1.5 text-xs font-bold">Moderate strain</h4>
            <p className="text-sm leading-relaxed">{moderate.map(normalize).join(", ").replace(/^./, (c) => c.toUpperCase())}</p>
          </div>
        )}
        {extreme.length > 0 && (
          <div className="rounded-xl bg-strain p-3.5 text-white dark:text-black">
            <h4 className="mb-1.5 text-xs font-bold">Extreme strain</h4>
            <p className="text-sm leading-relaxed">{extreme.map(normalize).join(", ").replace(/^./, (c) => c.toUpperCase())}</p>
          </div>
        )}
      </div>
    </Section>
  );
}

function Friction({ you, them, name }: { you: StyleProfile; them: StyleProfile; name: string }) {
  const copy = PAIRING_COPY[pairing(you, them)];
  const col = (who: string, key: StyleKey) => (
    <div className="rounded-xl bg-black/5 p-3.5 dark:bg-white/10">
      <h4 className="text-xs font-bold">
        {key} ({who})
      </h4>
      <div className="mb-1.5 text-xs opacity-70">Potential limitation</div>
      <p className="text-sm leading-relaxed">{STYLE_COPY[key].limitation}</p>
    </div>
  );
  return (
    <Section title="Where the friction sits">
      <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
        {col("you", you.sector)}
        {col(firstName(name), them.sector)}
      </div>
      <Callout label={copy.label}>{copy.text}</Callout>
    </Section>
  );
}

function Tips({ them }: { them: StyleProfile }) {
  const copy = STYLE_COPY[them.sector];
  const tips = [
    ...copy.do.map((text) => ({ text, good: true })),
    ...copy.dont.map((text) => ({ text, good: false })),
  ];
  return (
    <Section title="Walking in, try this">
      <ul className="space-y-3">
        {tips.map((t) => (
          <li key={t.text} className="flex items-start gap-3 text-[15px] leading-snug">
            <span
              aria-label={t.good ? "Do" : "Don't"}
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${t.good ? "bg-you-tint text-you" : "bg-strain-tint text-strain"}`}
            >
              {t.good ? "✓" : "✕"}
            </span>
            {t.text}
          </li>
        ))}
      </ul>
    </Section>
  );
}

// The "walking into a meeting" view: you, them, and where you will rub.
export function Brief({ you, them, themSections }: { you: Person; them: Person; themSections: TtiReportSection[] | null }) {
  const y = styleProfile(you.disc.natural);
  const t = styleProfile(them.disc.natural);
  const name = firstName(them.name);

  return (
    <article className="mx-auto w-full max-w-md overflow-clip sm:rounded-3xl sm:border sm:border-black/10 sm:dark:border-white/20">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/10 bg-background/90 px-4 py-3 backdrop-blur sm:px-5 dark:border-white/15">
        <div aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f2a3d] text-base font-bold text-white">
          {initials(them.name)}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold leading-tight">{them.name}</h2>
          <p className="text-xs opacity-70">Last mapped {them.disc.fetchedAt.toLocaleDateString()}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 px-4 pb-3 pt-4 sm:px-5">
        <span className="rounded-full bg-them-tint px-3 py-1.5 text-[13px] font-semibold text-them">{t.sector}</span>
        {t.sector !== "Balanced" && (
          <span className="rounded-full bg-you-tint px-3 py-1.5 text-[13px] font-semibold text-you">
            {t.orientation} · {t.pace}
          </span>
        )}
      </div>

      <p className="px-4 pb-5 text-base leading-relaxed sm:px-5">{STYLE_COPY[t.sector].summary}</p>

      <Section title="OXYGEN compass — you & them">
        <Compass you={y} them={t} />
        <Legend
          items={[
            { color: "var(--you)", text: `You — ${y.sector}` },
            { color: "var(--them)", text: `${name} — ${t.sector}` },
          ]}
        />
      </Section>

      <PaceGap you={y} them={t} name={them.name} />
      <AdaptationLoadSection person={them} />
      <Escalation sections={themSections} />
      <Friction you={y} them={t} name={them.name} />
      <Tips them={t} />

      <footer className="border-t border-black/10 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 text-center text-xs opacity-70 dark:border-white/15">
        Compass position is derived from DISC natural style.
        {CONTENT_IS_PLACEHOLDER && " Guidance text is draft copy."}
      </footer>
    </article>
  );
}

import Link from "next/link";
import { SECTORS, type Axes } from "@/lib/brief/style";
import { CX, CY, R, SECTOR_LABEL_POS } from "../compare/brief";

export type CompassMember = {
  id: string;
  name: string;
  isMe: boolean;
  axes: Axes;
  sector: (typeof SECTORS)[number] | "Balanced";
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const DOT = 14; // dot radius
const MIN_GAP = 2 * DOT + 4;

// Places each member on the compass: in the sector of their OXYGEN compass point, with distance from the centre
// and the angle within the sector taken from their DISC pace/orientation axes. Overlapping dots are nudged apart.
function place(members: CompassMember[]) {
  const dots = members.map((m) => {
    const sectorIdx = m.sector === "Balanced" ? -1 : SECTORS.indexOf(m.sector);
    const axesBearing = ((Math.atan2(m.axes.x, m.axes.y) * 180) / Math.PI + 360) % 360;
    let bearing = axesBearing;
    if (sectorIdx >= 0) {
      const centre = sectorIdx * 45;
      const off = ((axesBearing - centre + 540) % 360) - 180; // -180..180
      bearing = centre + Math.max(-18, Math.min(18, off));
    }
    // Keep dots inside the ring and clear of the sector labels.
    const radius = (0.25 + 0.5 * Math.min(1, Math.hypot(m.axes.x, m.axes.y))) * R;
    const rad = (bearing * Math.PI) / 180;
    return { m, x: CX + Math.sin(rad) * radius, y: CY - Math.cos(rad) * radius };
  });
  for (let pass = 0; pass < 40; pass++) {
    let moved = false;
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[j].x - dots[i].x;
        const dy = dots[j].y - dots[i].y;
        const d = Math.hypot(dx, dy);
        if (d < MIN_GAP) {
          const push = (MIN_GAP - d) / 2;
          const ux = d < 0.01 ? 1 : dx / d;
          const uy = d < 0.01 ? 0 : dy / d;
          dots[i].x -= ux * push;
          dots[i].y -= uy * push;
          dots[j].x += ux * push;
          dots[j].y += uy * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return dots;
}

export function GroupCompass({ groupId, members, notShared }: { groupId: string; members: CompassMember[]; notShared: string[] }) {
  const dots = place(members);
  const hrefFor = (m: CompassMember) => (m.isMe ? "/results" : `/compare/${m.id}?from=${groupId}`);

  return (
    <div className="space-y-4">
      {members.length === 0 ? (
        <p className="text-sm opacity-70">
          No one in this group has shared their assessment with you yet. Open the Manage Users tab to see who can share.
        </p>
      ) : (
        <svg
          viewBox="0 0 440 340"
          className="mx-auto w-full max-w-[560px]"
          role="group"
          aria-label="Group compass. Select a person to compare with them."
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
          <g fontSize="14" textAnchor="middle" fill="currentColor" opacity="0.85">
            {SECTORS.map((s) => (
              <text key={s} {...SECTOR_LABEL_POS[s]}>
                {s}
              </text>
            ))}
          </g>
          {dots.map(({ m, x, y }) => (
            <Link key={m.id} href={hrefFor(m)} aria-label={m.isMe ? "You: view my results" : `Compare with ${m.name}`}>
              <title>{m.isMe ? `${m.name} (you)` : `Compare with ${m.name}`}</title>
              {/* larger invisible target for touch */}
              <circle cx={x} cy={y} r={DOT + 8} fill="transparent" />
              <circle cx={x} cy={y} r={DOT} fill={m.isMe ? "var(--you)" : "var(--them)"} stroke="white" strokeWidth="1.5" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" pointerEvents="none">
                {initials(m.name)}
              </text>
            </Link>
          ))}
        </svg>
      )}

      {members.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-2">
          {members.map((m) => (
            <li key={m.id}>
              <Link
                href={hrefFor(m)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/30 px-3 text-sm no-underline hover:bg-primary-tint"
              >
                <span className="size-2.5 rounded-full" style={{ background: m.isMe ? "var(--you)" : "var(--them)" }} />
                {m.isMe ? "You" : m.name}
                <span className="opacity-60">{m.sector}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {notShared.length > 0 && (
        <p className="text-center text-sm opacity-70">Not shown (hasn&apos;t shared with you): {notShared.join(", ")}</p>
      )}
    </div>
  );
}

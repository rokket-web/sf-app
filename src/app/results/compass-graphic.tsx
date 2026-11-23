import fs from "node:fs";
import path from "node:path";
import type { compassPoint } from "./compass";

type Point = ReturnType<typeof compassPoint>;

// Star position (percent of the 588x600 compass image) for each point, just outside the ring, as in the PDF.
const STAR_AT: Record<string, { left: string; top: string }> = {
  N: { left: "50%", top: "27%" }, NE: { left: "66%", top: "34%" }, E: { left: "73.5%", top: "49%" }, SE: { left: "66%", top: "66%" },
  S: { left: "50%", top: "73%" }, SW: { left: "34%", top: "66%" }, W: { left: "26.5%", top: "49%" }, NW: { left: "34%", top: "34%" },
};

// A person's OXYGEN compass: the image for their natural-style point, with a star at their adapted-style point.
// Highlighted images live in public/report/compass/<point>.png (one per compass point).
export function CompassGraphic({ natural, adapted, caption = true }: { natural: Point; adapted: Point; caption?: boolean }) {
  const file =
    natural &&
    ["png", "svg"].map((e) => `${natural.key}.${e}`).find((f) => fs.existsSync(path.join(process.cwd(), "public/report/compass", f)));
  if (!file || !natural) return null;

  return (
    <figure className="space-y-2">
      <div className="relative mx-auto w-full max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/report/compass/${file}`} alt={`OXYGEN Compass, natural style: ${natural.label}`} className="w-full" />
        {adapted && (
          <span
            aria-label={`Adapted style: ${adapted.label}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-2xl leading-none"
            style={STAR_AT[adapted.dir]}
          >
            ★
          </span>
        )}
      </div>
      {caption && <figcaption className="text-right text-sm">&ldquo;Adapted&rdquo; Style: ★</figcaption>}
    </figure>
  );
}

import { Barlow_Condensed } from "next/font/google";

// Stronger Families / OXYGEN report look, taken from the TTI PDF.
// The PDF's own headings use a licensed condensed sans; Barlow Condensed is the closest free match.
export const headingFont = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"] });

export const BLUE = "#00a8e1";
export const NAVY = "#06283e";

export const COPYRIGHT = "Copyright © 2026. TTI Success Insights LTD. & Stronger Families. All rights reserved.";

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className={`${headingFont.className} text-4xl font-bold uppercase leading-none sm:text-5xl`} style={{ color: BLUE }}>
      {children}
    </h2>
  );
}

// One "page" of the report: navy + blue bars, "prepared for", content, copyright footer.
// Always white with dark text, like the printed report, in light and dark mode.
export function ReportPage({
  name,
  children,
  bare = false,
}: {
  name: string;
  children: React.ReactNode;
  bare?: boolean; // no header/footer (cover page)
}) {
  return (
    <article className="overflow-hidden rounded-sm border border-black/10 bg-white text-[#111] shadow-sm">
      <div className="flex gap-3 px-4 pt-4 sm:px-8">
        <div className="h-3 flex-1" style={{ background: NAVY }} />
        <div className="h-3 flex-1" style={{ background: BLUE }} />
      </div>
      {!bare && (
        <p className="px-4 pt-1 text-right text-xs text-[#4c4c4c] sm:px-8">
          prepared for: <strong className="uppercase text-[#111]">{name}</strong>
        </p>
      )}
      <div className="space-y-5 px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      {!bare && (
        <footer className="mx-4 flex items-center justify-between border-t py-3 text-[10px] text-[#4c4c4c] sm:mx-8" style={{ borderColor: BLUE }}>
          <span>{COPYRIGHT}</span>
        </footer>
      )}
    </article>
  );
}

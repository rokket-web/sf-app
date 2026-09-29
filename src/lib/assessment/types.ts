// Only the fields we rely on. Everything else in TTI's responses is ignored.
export type TtiRespondent = {
  passwd: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  resp_status: string | null;
  most_recent_report_id: number | null;
};

export type DiscScores = { d: number; i: number; s: number; c: number };

export type TtiReportSummary = {
  id: number;
  report_date: string;
  report_pdf_url?: string; // signed and short-lived: never cache
  respondent: { id: number; name: string; respondent_password: string };
  graphs?: Record<string, string>; // e.g. disc_natural, disc_adapted, disc_wheel (SVG URLs)
  scores: {
    // Confirmed against a real report on our link: DISC only, natural + adapted styles.
    disc?: { natural: DiscScores; adapted: DiscScores };
    // Documented by TTI but not present on our link's reports so far.
    motivators?: Record<string, number>;
    driving_forces?: Record<string, number>;
    eq?: Record<string, number>;
  };
};

// Full narrative report (GET /reports/{id}). Loosely typed: only the section shapes we render are modelled.
export type TtiReportSection = {
  type: string;
  format?: string;
  header?: { titles?: string[]; text?: string };
  prefix?: string;
  statements?: { ident?: string; stmts?: string[] }[];
  title?: string;
  wordlists?: { ident?: string; title?: string; prefix?: string; words?: string[] }[];
  styles?: {
    title?: string;
    ident?: string;
    natural?: { statements?: string[] };
    adapted?: { statements?: string[] };
  }[];
};

export type TtiFullReport = { report: { sections: TtiReportSection[] } };

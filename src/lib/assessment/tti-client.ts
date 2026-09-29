import type { TtiFullReport, TtiReportSummary, TtiRespondent } from "./types";

const BASE = process.env.TTI_API_BASE ?? "https://api.ttiadmin.com/api/v3";

export class TtiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

async function ttiGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const key = process.env.TTI_API_KEY;
  if (!key) throw new TtiError("TTI_API_KEY is not set.");

  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, String(v));

  const res = await fetch(url, {
    headers: { Authorization: key, Accept: "application/json" },
    redirect: "follow",
    cache: "no-store",
  });

  if (res.status === 429) throw new TtiError("TTI rate limit reached (100/min). Try again shortly.", 429);
  if (res.status === 401) throw new TtiError(`TTI rejected the API key on ${url.host}. Check TTI_API_KEY and TTI_API_BASE.`, 401);
  if (res.status === 404) throw new TtiError("Not found on TTI.", 404);
  if (!res.ok) throw new TtiError(`TTI request failed (${res.status}).`, res.status);
  return (await res.json()) as T;
}

function scope(): Record<string, string> {
  const link = process.env.TTI_LINK_LOGIN;
  if (link) return { link_login: link };
  const account = process.env.TTI_ACCOUNT_LOGIN;
  return account ? { account_login: account } : {};
}

export const tti = {
  ping: () => ttiGet<unknown>("/ping"),

  // Lookups are limited to our assessment link so we never match respondents from other links/accounts.
  respondentsByEmail: (email: string) =>
    ttiGet<TtiRespondent[]>("/respondents", { email, ...scope() }),

  respondent: (passwd: string) => ttiGet<TtiRespondent>(`/respondents/${encodeURIComponent(passwd)}`),

  // Name is not a server-side filter, so page through respondents and match locally.
  async searchRespondentsByName(query: string, maxPages = 5): Promise<TtiRespondent[]> {
    const q = query.trim().toLowerCase();
    const found: TtiRespondent[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const batch = await ttiGet<TtiRespondent[]>("/respondents", { page, per_page: 100, ...scope() });
      for (const r of batch) {
        const full = `${r.first_name ?? ""} ${r.last_name ?? ""}`.toLowerCase();
        if (full.includes(q)) found.push(r);
      }
      if (batch.length < 100) break;
    }
    return found;
  },

  fullReport: (reportId: number) => ttiGet<TtiFullReport>(`/reports/${reportId}`),

  reportSummary: (reportId: number) => ttiGet<TtiReportSummary>(`/reports/${reportId}/summary`),
};

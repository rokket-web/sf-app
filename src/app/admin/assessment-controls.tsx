"use client";

import { useActionState } from "react";
import {
  submitTtiUser,
  autoLinkUser,
  manualLinkUser,
  refreshUserResults,
  searchTti,
  unlinkUser,
  type LinkState,
  type SearchResult,
  type SearchState,
} from "./actions";

const btn = "rounded border border-black/20 px-2 py-1 text-xs disabled:opacity-50 dark:border-white/30";

function Msg({ state }: { state: LinkState }) {
  if (!state) return null;
  return <p className={`text-xs ${state.ok ? "text-green-600" : "text-red-600"}`}>{state.message}</p>;
}

export function UserAssessmentControls({ userId, linkedTo }: { userId: string; linkedTo: string | null }) {
  const [autoState, autoAction, autoPending] = useActionState<LinkState, FormData>(autoLinkUser, null);
  const [manualState, manualAction, manualPending] = useActionState<LinkState, FormData>(manualLinkUser, null);
  const [unlinkState, unlinkAction] = useActionState<LinkState, FormData>(unlinkUser, null);
  const [refreshState, refreshAction, refreshPending] = useActionState<LinkState, FormData>(refreshUserResults, null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={autoAction}>
          <input type="hidden" name="userId" value={userId} />
          <button className={btn} disabled={autoPending}>{autoPending ? "Looking up…" : "Auto-link by email"}</button>
        </form>
        <form action={manualAction} className="flex gap-1">
          <input type="hidden" name="userId" value={userId} />
          <input
            name="passwd"
            placeholder="Respondent ID"
            defaultValue={linkedTo ?? ""}
            className="w-32 rounded border border-black/20 px-2 py-1 text-xs dark:border-white/30 dark:bg-transparent"
          />
          <button className={btn} disabled={manualPending}>Link</button>
        </form>
        {linkedTo && (
          <>
            <form action={refreshAction}>
              <input type="hidden" name="userId" value={userId} />
              <button className={btn} disabled={refreshPending}>{refreshPending ? "Fetching…" : "Refresh results"}</button>
            </form>
            <form action={unlinkAction}>
              <input type="hidden" name="userId" value={userId} />
              <button className={btn}>Unlink</button>
            </form>
          </>
        )}
      </div>
      <Msg state={autoState} />
      <Msg state={manualState} />
      <Msg state={refreshState} />
      <Msg state={unlinkState} />
    </div>
  );
}

function AddFromTti({ r }: { r: SearchResult }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(submitTtiUser, null);
  const done = state?.ok;
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="passwd" value={r.passwd} />
      {!done && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            name="email"
            type="email"
            required
            defaultValue={r.email ?? ""}
            placeholder="Email"
            className="w-56 rounded border border-black/20 px-2 py-1 text-xs dark:border-white/30 dark:bg-transparent"
          />
          <button name="intent" value="add" className={btn} disabled={pending}>
            Add to Users
          </button>
          <button name="intent" value="invite" className={btn} disabled={pending}>
            Invite via Email
          </button>
          {pending && <span className="text-xs opacity-70">Working…</span>}
        </div>
      )}
      <Msg state={state} />
    </form>
  );
}

const STATUS_LABEL: Record<Exclude<SearchResult["status"], "available">, string> = {
  user: "Already has an account",
  linked: "Already linked to a user",
  invited: "Invitation pending",
};

export function TtiSearch() {
  const [state, action, pending] = useActionState<SearchState, FormData>(searchTti, null);

  return (
    <div className="space-y-3">
      <form action={action} className="flex gap-2">
        <input
          name="q"
          placeholder="Email or name"
          className="flex-1 rounded border border-black/20 px-3 py-2 dark:border-white/30 dark:bg-transparent"
        />
        <button disabled={pending} className="rounded border border-black/20 px-3 py-2 disabled:opacity-50 dark:border-white/30">
          {pending ? "Searching…" : "Search TTI"}
        </button>
      </form>
      {state?.message && <p className="text-sm opacity-70">{state.message}</p>}
      {state?.results && (
        <ul className="divide-y divide-black/10 dark:divide-white/20">
          {state.results.map((r) => (
            <li key={r.passwd} className="space-y-1 py-3">
              <div className="text-sm">
                <strong>{r.name || "(no name)"}</strong> · {r.email ?? "no email"}
                {r.company ? ` · ${r.company}` : ""}
                <span className="ml-2 font-mono text-xs opacity-60">{r.passwd}</span>
              </div>
              {r.status === "available" ? (
                <AddFromTti r={r} />
              ) : (
                <p className="text-xs opacity-70">{STATUS_LABEL[r.status]}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

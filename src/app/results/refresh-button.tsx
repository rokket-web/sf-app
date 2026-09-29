"use client";

import { useActionState } from "react";
import { refreshMyResults, type RefreshState } from "./actions";

export function RefreshButton() {
  const [state, action, pending] = useActionState<RefreshState, FormData>(refreshMyResults, null);
  return (
    <form action={action} className="flex items-center gap-3">
      <button disabled={pending} className="rounded border border-black/20 px-3 py-1 text-sm disabled:opacity-50 dark:border-white/30">
        {pending ? "Refreshing…" : "Refresh from TTI"}
      </button>
      {state && <span className={`text-sm ${state.ok ? "text-green-600" : "text-red-600"}`}>{state.message}</span>}
    </form>
  );
}

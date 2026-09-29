"use client";

import { useActionState } from "react";
import { grantAccess, revokeAccess, type ShareState } from "./actions";

export function ShareForm({ viewers }: { viewers: { grantId: string; label: string }[] }) {
  const [state, action, pending] = useActionState<ShareState, FormData>(grantAccess, null);

  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          placeholder="Their account email"
          className="flex-1 rounded border border-black/20 px-3 py-2 dark:border-white/30 dark:bg-transparent"
        />
        <button
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          Share my results
        </button>
      </form>
      {state && <p className={state.ok ? "text-green-600" : "text-red-600"}>{state.message}</p>}

      {viewers.length === 0 ? (
        <p className="text-sm opacity-70">You haven&apos;t shared your results with anyone.</p>
      ) : (
        <ul className="divide-y divide-black/10 dark:divide-white/20">
          {viewers.map((v) => (
            <li key={v.grantId} className="flex items-center justify-between py-2">
              <span>{v.label}</span>
              <form action={revokeAccess}>
                <input type="hidden" name="grantId" value={v.grantId} />
                <button className="text-sm text-red-600 underline">Stop sharing</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

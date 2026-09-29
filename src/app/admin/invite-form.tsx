"use client";

import { useActionState } from "react";
import { inviteUser, type InviteState } from "./actions";

export function InviteForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(inviteUser, null);

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <input
        name="email"
        type="email"
        required
        placeholder="name@example.com"
        className="flex-1 rounded border border-black/20 px-3 py-2 dark:border-white/30 dark:bg-transparent"
      />
      <button
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Sending…" : "Send invite"}
      </button>
      {state && (
        <p role="status" className={state.ok ? "text-green-600" : "text-red-600"}>
          {state.message}
        </p>
      )}
    </form>
  );
}

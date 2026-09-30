"use client";

import { startViewAs } from "@/app/view-as/actions";

export function ViewAsPicker({ users }: { users: { id: string; label: string }[] }) {
  return (
    <form action={startViewAs} className="flex items-center gap-1">
      <label htmlFor="view-as" className="sr-only">
        View as user
      </label>
      <select
        id="view-as"
        name="userId"
        defaultValue=""
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border border-black/20 bg-transparent px-2 py-1 text-xs dark:border-white/30"
      >
        <option value="" disabled>
          View as…
        </option>
        {users.map((u) => (
          <option key={u.id} value={u.id} className="text-black">
            {u.label}
          </option>
        ))}
      </select>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { addExistingUser, createGroup, inviteMember, type GroupState } from "./actions";

const input = "rounded border border-black/20 px-3 py-2 dark:border-white/30 dark:bg-transparent";
const primary = "rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black";

export function CreateGroupForm() {
  const [state, action, pending] = useActionState<GroupState, FormData>(createGroup, null);
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <input name="name" required maxLength={80} placeholder="Group name" className={`${input} flex-1`} />
      <select name="type" defaultValue="work" className={input}>
        <option value="work">Work</option>
        <option value="personal">Personal</option>
      </select>
      <button disabled={pending} className={primary}>Create group</button>
      {state && !state.ok && <p className="text-red-600">{state.message}</p>}
    </form>
  );
}

export function InviteMemberForm({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState<GroupState, FormData>(inviteMember, null);
  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="groupId" value={groupId} />
        <input name="email" type="email" required placeholder="Member's account email" className={`${input} flex-1`} />
        <button disabled={pending} className={primary}>Invite</button>
      </div>
      {state && <p className={state.ok ? "text-green-600" : "text-red-600"}>{state.message}</p>}
    </form>
  );
}

export function AddExistingUserForm({
  groupId,
  candidates,
}: {
  groupId: string;
  candidates: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState<GroupState, FormData>(addExistingUser, null);

  if (candidates.length === 0) {
    return <p className="text-sm opacity-70">Every current user is already in this group.</p>;
  }
  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="groupId" value={groupId} />
        <select name="userId" required defaultValue="" className={`${input} flex-1`}>
          <option value="" disabled>
            Choose a user…
          </option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button disabled={pending} className={primary}>Add to group</button>
      </div>
      {state && <p className={state.ok ? "text-green-600" : "text-red-600"}>{state.message}</p>}
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "./actions";

type Props = {
  profile: {
    displayName: string;
    photoUrl: string | null;
    bio: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    visibility: "private" | "group_members" | "public";
  };
};

const input =
  "w-full rounded border border-black/20 px-3 py-2 dark:border-white/30 dark:bg-transparent";

export function ProfileForm({ profile }: Props) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, null);

  return (
    <form action={action} className="space-y-4">
      <div className="flex items-center gap-4">
        {profile.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoUrl} alt="" className="size-20 rounded-full object-cover" />
        ) : (
          <div className="size-20 rounded-full bg-black/10 dark:bg-white/20" />
        )}
        <label className="text-sm">
          Photo (max 5 MB)
          <input name="photo" type="file" accept="image/*" className="mt-1 block" />
        </label>
      </div>

      <label className="block">
        <span className="text-sm">Display name</span>
        <input name="displayName" required defaultValue={profile.displayName} className={input} />
      </label>

      <label className="block">
        <span className="text-sm">Bio</span>
        <textarea name="bio" rows={4} defaultValue={profile.bio ?? ""} className={input} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm">Contact email</span>
          <input name="contactEmail" type="email" defaultValue={profile.contactEmail ?? ""} className={input} />
        </label>
        <label className="block">
          <span className="text-sm">Contact phone</span>
          <input name="contactPhone" type="tel" defaultValue={profile.contactPhone ?? ""} className={input} />
        </label>
      </div>

      <label className="block">
        <span className="text-sm">Who can see my profile</span>
        <select name="visibility" defaultValue={profile.visibility} className={input}>
          <option value="private">Only me</option>
          <option value="group_members">Members of my groups</option>
          <option value="public">Everyone</option>
        </select>
      </label>

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state && (
          <p role="status" className={state.ok ? "text-green-600" : "text-red-600"}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

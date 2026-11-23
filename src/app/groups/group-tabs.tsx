"use client";

import { useState } from "react";

// Two-tab layout for the group page. Both panels are rendered on the server and passed in; this only switches which is visible.
export function GroupTabs({ compass, manage }: { compass: React.ReactNode; manage: React.ReactNode }) {
  const [tab, setTab] = useState<"compass" | "manage">("compass");
  const tabs = [
    { id: "compass", label: "Compass" },
    { id: "manage", label: "Manage Users" },
  ] as const;

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Group views" className="flex border-b border-black/10 dark:border-white/20">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px min-h-11 flex-1 border-b-2 px-4 text-sm font-semibold sm:flex-none ${
              tab === t.id ? "border-accent text-primary" : "border-transparent opacity-70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panel-compass" aria-labelledby="tab-compass" hidden={tab !== "compass"}>
        {compass}
      </div>
      <div role="tabpanel" id="panel-manage" aria-labelledby="tab-manage" hidden={tab !== "manage"} className="space-y-8">
        {manage}
      </div>
    </div>
  );
}

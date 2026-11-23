"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change (adjust state during render rather than in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="nav-drawer"
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col gap-2 border-l-4 border-accent bg-white p-4 text-[#171717] shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="inline-flex size-11 items-center justify-center self-end rounded"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <nav className="flex flex-col gap-1 text-base [&>a]:flex [&>a]:min-h-11 [&>a]:items-center [&>a]:gap-3 [&>a]:rounded [&>a]:px-2 [&>a]:hover:bg-primary-tint">
          {children}
        </nav>
      </aside>
    </>
  );
}

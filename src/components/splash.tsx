"use client";

import { useState } from "react";

/** Full-screen logo splash: fades up/in, holds ~3s, fades out, then unmounts. */
export function Splash() {
  const [done, setDone] = useState(false);
  if (done) return null;
  return (
    <div
      className="splash"
      aria-hidden="true"
      onAnimationEnd={(e) => {
        if (e.animationName === "splash-out") setDone(true);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="splash-logo splash-light" src="/logo-light.svg" alt="" width={324} height={35} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="splash-logo splash-dark" src="/logo-white.png" alt="" width={210} height={90} />
    </div>
  );
}

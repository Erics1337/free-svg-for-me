"use client";

import { useEffect } from "react";

export function AnkurEasterEgg() {
  useEffect(() => {
    // A tasteful Easter egg for Ankur 🎉
    console.log(
      "%c👋 Hi Ankur!",
      "font-size: 24px; font-weight: bold; color: #a855f7; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);"
    );
    console.log(
      "%cThanks for checking out my site! You're awesome. 🚀",
      "font-size: 14px; color: #22d3ee;"
    );
    console.log(
      "%c— Eric",
      "font-size: 12px; font-style: italic; color: #94a3b8;"
    );
  }, []);

  // Renders nothing visible - it's a secret!
  return null;
}

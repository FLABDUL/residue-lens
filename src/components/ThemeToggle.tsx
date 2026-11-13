"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("residue-lens-theme-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("residue-lens-theme-change", onStoreChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light");

  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("residue-lens-theme", next);
    } catch {
      // The selected theme still applies for this page when storage is unavailable.
    }
    window.dispatchEvent(new Event("residue-lens-theme-change"));
  }

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} theme`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none">
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="3.5" fill="currentColor" />
            <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </>
        ) : (
          <path d="M19.4 15.1A8 8 0 0 1 8.9 4.6 8 8 0 1 0 19.4 15.1Z" fill="currentColor" />
        )}
      </svg>
    </button>
  );
}

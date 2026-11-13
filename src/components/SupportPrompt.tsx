"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isSupportPromptExcluded, shouldShowSupportPrompt, SUPPORT_PROMPT_STORAGE_KEY } from "@/lib/support-prompt";

const DELAY_MS = 30_000;

export function SupportPrompt() {
  const pathname = usePathname();
  const [visiblePath, setVisiblePath] = useState<string | null>(null);

  useEffect(() => {
    if (isSupportPromptExcluded(pathname)) return;

    let dismissedAt: string | null = null;
    try {
      dismissedAt = window.localStorage.getItem(SUPPORT_PROMPT_STORAGE_KEY);
    } catch {}
    if (!shouldShowSupportPrompt(dismissedAt, Date.now())) return;

    const timer = window.setTimeout(() => setVisiblePath(pathname), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  function dismiss() {
    try { window.localStorage.setItem(SUPPORT_PROMPT_STORAGE_KEY, String(Date.now())); } catch {}
    setVisiblePath(null);
  }

  if (visiblePath !== pathname || isSupportPromptExcluded(pathname)) return null;

  return <aside className="support-prompt" aria-label="Support Residue Lens prompt">
    <button className="support-prompt-close" type="button" aria-label="Dismiss support message" onClick={dismiss}>×</button>
    <p className="eyebrow">Keep the evidence clear</p>
    <h2>Finding this useful?</h2>
    <p>Residue Lens is independent and free to use. A small contribution helps cover data, hosting and verification.</p>
    <div className="support-prompt-actions"><Link className="primary-button" href="/support" onClick={dismiss}>Support Residue Lens</Link><button className="text-button" type="button" onClick={dismiss}>Not now</button></div>
  </aside>;
}

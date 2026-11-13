"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { submitProductInput } from "@/app/actions/submissions";
import { track } from "@vercel/analytics";

export function InterestSignup({ interest = "Residue Lens Plus" }: { interest?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await submitProductInput({ kind: "interest", message: interest, email, sourcePath: "/pro" });
      setStatus(result.message);
      if (result.ok) { track("plus_waitlist_joined"); setEmail(""); }
    });
  }
  return <form className="interest-signup" onSubmit={submit}><label htmlFor="interest-email">Email me about a possible future Plus plan</label><div><input id="interest-email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /><button type="submit" disabled={pending}>{pending ? "Joining…" : "Join waitlist"}</button></div><p>Your address is stored only for this product update when the secure product inbox is connected. You can withdraw at any time. <Link href="/privacy">How your information is used.</Link></p><p role="status" aria-live="polite">{status}</p></form>;
}

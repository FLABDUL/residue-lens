"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { submitProductInput } from "@/app/actions/submissions";
import { track } from "@vercel/analytics";

export function FeedbackForm() {
  const [message, setMessage] = useState(""); const [email, setEmail] = useState(""); const [status, setStatus] = useState(""); const [pending, startTransition] = useTransition();
  async function copy() { if (!message.trim()) { setStatus("Write a short note first."); return; } try { await navigator.clipboard.writeText(`Residue Lens feedback\n\n${message.trim()}`); setStatus("Feedback copied. Paste it into the channel you use to contact the project owner."); } catch { setStatus("Select and copy your note manually. Nothing has been sent."); } }
  function submit(event: React.FormEvent) { event.preventDefault(); startTransition(async () => { const result = await submitProductInput({ kind: "feedback", message, email, sourcePath: "/feedback" }); setStatus(result.message); if (result.ok) { track("feedback_submitted"); setMessage(""); setEmail(""); } }); }
  return <form className="feedback-form" onSubmit={submit}><label htmlFor="feedback-note">What should we improve?</label><textarea id="feedback-note" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} required rows={7} placeholder="A confusing label, missing food, incorrect result, or feature you would return for…" /><label htmlFor="feedback-email">Email for a reply <span>(optional)</span></label><input id="feedback-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" placeholder="you@example.com" /><input className="form-honeypot" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" /><div className="form-actions"><button type="submit" disabled={pending}>{pending ? "Sending…" : "Send feedback"}</button><button className="secondary-button" type="button" onClick={copy}>Copy instead</button></div><p>Your note is stored in the private project inbox when connected. An optional email is used only to reply. <Link href="/privacy">How your information is used.</Link></p><p role="status" aria-live="polite">{status}</p></form>;
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { track } from "@vercel/analytics";
import { submitProductInput } from "@/app/actions/submissions";

export function FoodRequest() {
  const [food, setFood] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const request = food.trim().slice(0, 60);
    if (!request) return;
    startTransition(async () => {
      const result = await submitProductInput({ kind: "food-request", message: request, sourcePath: "/request-food" });
      setStatus(result.message);
      if (result.ok) { track("food_request_submitted"); setFood(""); }
    });
  }
  return <form className="request-form" onSubmit={submit}><label htmlFor="food-request">Food or product group</label><div><input id="food-request" value={food} onChange={(event) => { setFood(event.target.value); setStatus(""); }} maxLength={60} placeholder="e.g. raspberries" required /><button type="submit" disabled={pending}>{pending ? "Sending…" : "Request it"}</button></div><p>When the private inbox is connected, this saves the food name for product planning. Do not include personal information. <Link href="/privacy">How submissions are used.</Link></p><p role="status" aria-live="polite">{status}</p></form>;
}

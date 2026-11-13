"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BillingPortalButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");

  async function openPortal() {
    setPending(true);
    setStatus("");

    try {
      const response = await fetch("/api/billing-portal", { method: "POST" });
      const result = (await response.json()) as { url?: string; error?: string };

      if (response.status === 401) {
        router.push("/account");
        return;
      }

      if (result.url) {
        window.location.href = result.url;
        return;
      }

      setStatus(result.error ?? "Billing management could not be opened.");
    } catch {
      setStatus("Billing management could not be opened. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="billing-portal-control">
      <button type="button" disabled={pending} onClick={openPortal}>
        {pending ? "Opening billing…" : "Manage subscription"}
      </button>
      <p className="form-status" role="status" aria-live="polite">{status}</p>
    </div>
  );
}

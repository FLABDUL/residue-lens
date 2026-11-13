"use client";

import { useEffect } from "react";

export function OfflineCleanup() {
  useEffect(() => {
    async function retireOfflineCopies() {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("residue-lens-")).map((key) => caches.delete(key)));
      }
    }

    retireOfflineCopies().catch(() => undefined);
  }, []);

  return null;
}

"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { deleteCloudLists, downloadHousehold, uploadHousehold } from "@/app/actions/lists";
import { readHousehold, writeHousehold } from "@/lib/saved-foods";

export function AccountPanel() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload() {
    setBusy(true);
    const result = await uploadHousehold(readHousehold());
    setStatus(result.message);
    setBusy(false);
  }

  async function download() {
    setBusy(true);
    const result = await downloadHousehold();
    if (result.ok && result.household) writeHousehold(result.household);
    setStatus(result.message);
    setBusy(false);
  }

  async function removeCloudCopy() {
    if (!window.confirm("Delete every list stored in your Residue Lens account? Lists in this browser will remain.")) return;
    setBusy(true);
    const result = await deleteCloudLists();
    setStatus(result.message);
    setBusy(false);
  }

  return (
    <section className="account-panel" aria-labelledby="account-panel-title">
      <Show when="signed-out">
        <h2 id="account-panel-title">Create or access your account</h2>
        <p>Use a secure sign-in to synchronise your named lists. Your existing browser lists remain here until you choose to upload them.</p>
        <div className="account-actions"><SignUpButton mode="modal"><button type="button">Create account</button></SignUpButton><SignInButton mode="modal"><button type="button">Sign in</button></SignInButton></div>
      </Show>
      <Show when="signed-in">
        <div className="account-heading"><div><p className="eyebrow">Signed in</p><h2 id="account-panel-title">Choose which copy wins</h2></div><UserButton /></div>
        <p>Uploads replace your current cloud copy. Downloads replace the lists in this browser. This deliberate choice avoids silent merge surprises.</p>
        <div className="account-actions"><button type="button" disabled={busy} onClick={upload}>Upload this device</button><button type="button" disabled={busy} onClick={download}>Load cloud lists</button><button type="button" disabled={busy} onClick={removeCloudCopy}>Delete cloud lists</button></div>
        <p className="form-status" role="status" aria-live="polite">{status}</p>
      </Show>
    </section>
  );
}

export function AccountUnavailable() {
  return <section className="account-panel"><h2>Account service not connected on this preview</h2><p>The application code supports optional sign-in and cloud list sync, but no identity or database credentials are configured locally. Your lists continue to stay only in this browser.</p></section>;
}

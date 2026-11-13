import Link from "next/link";

export default function OfflinePage() {
  return <main className="status-page"><p className="eyebrow">Offline</p><h1>Your saved list still works.</h1><p>Open My list to use any data already stored on this device. Reconnect to refresh comparisons or open a food you have not visited before.</p><Link className="primary-button" href="/my-list">Open my list</Link></main>;
}

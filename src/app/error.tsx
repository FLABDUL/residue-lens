"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="status-page"><p className="eyebrow">Something went wrong</p><h1>The comparison could not load.</h1><p>Your saved foods remain in this browser. Try loading the page again.</p><button className="primary-button" type="button" onClick={reset}>Try again</button></main>; }

import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
export default function NotFound() { return <><SiteHeader /><main className="status-page"><p className="eyebrow">404</p><h1>That result is not in this basket.</h1><p>The page may have moved, or that food is not yet covered by the monitoring explorer.</p><Link className="primary-button" href="/">Return to the explorer</Link></main><SiteFooter /></>; }

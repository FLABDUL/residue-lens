import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { AccountPanel, AccountUnavailable } from "@/components/AccountPanel";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { formatSubscriptionDate, getCurrentSubscription } from "@/lib/entitlements";
import { clerkConfigured, databaseConfigured, stripeConfigured } from "@/lib/server-config";

export const metadata: Metadata = { title: "Account options | Residue Lens", robots: { index: false, follow: false } };
export default async function AccountPage() {
  const accountEnabled = clerkConfigured && databaseConfigured;
  const subscription = accountEnabled && stripeConfigured ? await getCurrentSubscription() : null;
  const hasPlus = subscription?.hasPlus ?? false;
  const cancellationDate = subscription?.cancelAt ? formatSubscriptionDate(subscription.cancelAt) : null;

  return <ContentPage eyebrow="Account options" title="An account is optional." intro="Without an account, named lists live only in this browser. Sign-in adds deliberate cross-device sync without removing private local use.">
  {accountEnabled ? <AccountPanel /> : <AccountUnavailable />}
  {hasPlus ? <section className="subscription-status" aria-label="Subscription status"><div><p className="eyebrow">Subscription record</p><h2>{cancellationDate ? `Plus ends ${cancellationDate}` : "Residue Lens Plus is active"}</h2><p>{cancellationDate ? `Your subscription remains recorded until ${cancellationDate}. All current evidence and list features are now available free.` : "Your existing subscription record remains active, but all current evidence and list features are now available free. You can review or cancel it in the billing portal."}</p></div><BillingPortalButton /></section> : null}
  <p><Link href="/my-list">Manage My list →</Link></p>
  <p>Account data and browser-only data are kept separate until you explicitly upload or download. The app never silently replaces either copy.</p>
</ContentPage>; }

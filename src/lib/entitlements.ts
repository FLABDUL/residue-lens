import { getDatabase } from "./db";
import { getOptionalUserId } from "./server-auth";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export type SubscriptionState = {
  hasPlus: boolean;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAt: Date | null;
};

const NO_SUBSCRIPTION: SubscriptionState = {
  hasPlus: false,
  status: "free",
  currentPeriodEnd: null,
  cancelAt: null,
};

export async function getCurrentSubscription(): Promise<SubscriptionState> {
  const userId = await getOptionalUserId();
  const sql = getDatabase();
  if (!userId || !sql) return NO_SUBSCRIPTION;

  const rows = await sql<Array<{ subscription_status: string; current_period_end: Date | null; cancel_at: Date | null }>>`
    SELECT subscription_status, current_period_end, cancel_at
    FROM user_profiles
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  const profile = rows[0];
  if (!profile) return NO_SUBSCRIPTION;

  const hasPlus = ACTIVE_STATUSES.has(profile.subscription_status)
    && (!profile.current_period_end || profile.current_period_end.getTime() > Date.now());

  return {
    hasPlus,
    status: profile.subscription_status,
    currentPeriodEnd: profile.current_period_end,
    cancelAt: profile.cancel_at,
  };
}

export async function currentUserHasPlus() {
  return (await getCurrentSubscription()).hasPlus;
}

export function formatSubscriptionDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(date);
}

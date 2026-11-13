import type { BeforeSendEvent } from "@vercel/analytics/next";

const privateRoute = /^\/(?:account|admin)(?:\/|$)/;
const allowedUtmParameters = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;
const categoricalUtmValue = /^[a-z0-9][a-z0-9_-]{0,39}$/;

export function sanitiseAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url);
    if (privateRoute.test(url.pathname)) return null;

    const retainedParameters = new URLSearchParams();
    for (const parameter of allowedUtmParameters) {
      const value = url.searchParams.get(parameter);
      if (value && categoricalUtmValue.test(value)) retainedParameters.set(parameter, value);
    }

    url.search = retainedParameters.toString();
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
}

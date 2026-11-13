import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkConfigured } from "./lib/server-config";

const proxy = clerkConfigured ? clerkMiddleware() : () => NextResponse.next();

export default proxy;

export const config = {
  // Next.js requires literal matcher values here for build-time analysis.
  matcher: [
    "/account/:path*",
    "/admin/submissions/:path*",
    "/api/checkout/:path*",
    "/api/billing-portal/:path*",
  ],
};

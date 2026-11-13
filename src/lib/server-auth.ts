import { clerkConfigured } from "./server-config";

export async function getOptionalUserId() {
  if (!clerkConfigured) return null;
  const { auth } = await import("@clerk/nextjs/server");
  const session = await auth();
  return session.userId;
}

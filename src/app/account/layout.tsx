import type { ReactNode } from "react";
import { AppProviders } from "@/components/AppProviders";
import { clerkConfigured } from "@/lib/server-config";

export default function AccountLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AppProviders clerkEnabled={clerkConfigured}>{children}</AppProviders>;
}

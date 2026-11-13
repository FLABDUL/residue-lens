"use client";

import { track } from "@vercel/analytics";
import type { ReactNode } from "react";

export function SupportLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} className={className} target="_blank" rel="noreferrer" onClick={() => track("support_link_clicked")}>{children}</a>;
}

"use server";

import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db";

export type SubmissionResult = { ok: boolean; message: string };

function clean(value: string, maximum: number) {
  return value.replaceAll(/\s+/g, " ").trim().slice(0, maximum);
}

function validEmail(value: string) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function submitProductInput(input: {
  kind: "feedback" | "food-request" | "interest";
  message: string;
  email?: string;
  sourcePath?: string;
  website?: string;
}): Promise<SubmissionResult> {
  if (input.website) return { ok: true, message: "Thank you." };
  const message = clean(input.message, input.kind === "feedback" ? 2000 : 120);
  const email = clean(input.email ?? "", 254).toLowerCase();
  const sourcePath = clean(input.sourcePath ?? "", 200);
  if (!message) return { ok: false, message: "Please enter a little more detail." };
  if (!validEmail(email)) return { ok: false, message: "Check the email address or leave it blank." };

  const sql = getDatabase();
  if (!sql) return {
    ok: false,
    message: "The private inbox is not connected on this preview. Nothing was sent.",
  };

  try {
    await sql`
      INSERT INTO submissions (id, kind, message, email, source_path)
      VALUES (${randomUUID()}, ${input.kind}, ${message}, ${email || null}, ${sourcePath || null})
    `;
    return {
      ok: true,
      message: email
        ? "Received. Your email will only be used to follow up on this submission."
        : "Received anonymously. Thank you.",
    };
  } catch {
    return { ok: false, message: "The submission could not be saved. Nothing was recorded; please try again later." };
  }
}

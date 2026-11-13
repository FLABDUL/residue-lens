import postgres from "postgres";
import { assertDatabaseTarget } from "@/lib/database-target.mjs";

let client: ReturnType<typeof postgres> | null | undefined;

export function getDatabase() {
  if (client !== undefined) return client;
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    assertDatabaseTarget(connectionString, process.env.VERCEL_ENV);
  }
  client = connectionString
    ? postgres(connectionString, { max: 4, prepare: false, idle_timeout: 20 })
    : null;
  return client;
}

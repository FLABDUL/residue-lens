const expectedDatabaseByEnvironment = Object.freeze({
  production: "neondb",
  preview: "residue_lens_dev",
  development: "residue_lens_dev",
});

export function databaseNameFromUrl(connectionString) {
  let url;

  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!databaseName || databaseName.includes("/")) {
    throw new Error("DATABASE_URL does not identify one PostgreSQL database.");
  }

  return databaseName;
}

export function assertDatabaseTarget(connectionString, vercelEnvironment) {
  if (!vercelEnvironment) return;

  const expectedDatabase = expectedDatabaseByEnvironment[vercelEnvironment];
  if (!expectedDatabase) {
    throw new Error(`Refusing database connection for unknown Vercel environment “${vercelEnvironment}”.`);
  }

  const actualDatabase = databaseNameFromUrl(connectionString);
  if (actualDatabase !== expectedDatabase) {
    throw new Error(
      `Refusing ${vercelEnvironment} database connection: expected “${expectedDatabase}”, received “${actualDatabase}”.`,
    );
  }
}

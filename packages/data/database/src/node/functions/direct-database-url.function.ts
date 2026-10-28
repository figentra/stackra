/**
 * Stackra file contract:
 * Purpose: `directDatabaseUrl(env?)`, the connection string of a session-mode tool (the migration and seed runners,
 *          and any CLI that sets session state): `DATABASE_DIRECT_URL`, the server itself past the pooling proxy, or
 *          `DATABASE_URL` when no proxy stands in front (local, test containers).
 * Boundary: reads the environment only; never logs the value. A transaction-mode proxy (RDS Proxy pins, PgBouncer
 *           breaks) cannot hold a session `SET` or a session advisory lock, so these tools never go through it.
 * Runtime: node
 * Governing contract: ADR 0473 (decision 3); ADR 0159 (decision 3: session timeouts and the runner's lock).
 */

/**
 * The direct connection string.
 *
 * @param env - the environment, `process.env` by default.
 * @throws Error when neither `DATABASE_DIRECT_URL` nor `DATABASE_URL` is set.
 * @example
 * directDatabaseUrl({ DATABASE_URL: "postgres://host/app" }); // "postgres://host/app"
 */
export function directDatabaseUrl(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  for (const name of ["DATABASE_DIRECT_URL", "DATABASE_URL"]) {
    const url = env[name];
    if (url !== undefined && url !== "") return url;
  }
  throw new Error("DATABASE_DIRECT_URL (or DATABASE_URL) is not set for this member");
}

/**
 * Stackra file contract:
 * Purpose: `isLocalDatabaseUrl(url)`, whether a Postgres connection string names a database on this machine: a
 *          loopback host (`localhost`, a `*.localhost` name, `127.0.0.0/8`, `::1`), a Unix socket folder or no host
 *          (the driver default, which is local). The data step of root `stackra dev` migrates and seeds only such a
 *          database.
 * Boundary: pure; parses the string and never connects. An unparsable string, or one with any other host, is not local.
 * Runtime: node
 * Governing contract: STA-2840 (auto-seed refuses a database that is not local).
 */

/**
 * Whether `url` is a connection string to a database on this machine.
 *
 * @param url - a `postgres://` or `postgresql://` connection string.
 * @returns true for a loopback host, a Unix socket or no host; false otherwise.
 * @example
 * isLocalDatabaseUrl("postgresql://user@127.0.0.1:9500/billing"); // true
 * isLocalDatabaseUrl("postgresql://user@db.example.com/billing"); // false
 */
export function isLocalDatabaseUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const host = parsed.hostname === "" ? parsed.searchParams.get("host") : parsed.hostname;
  // No host at all: the driver uses the default Unix socket or localhost, both on this machine.
  if (host === null || host.startsWith("/")) return true;
  return isLoopbackHost(host.toLowerCase().replaceAll(/^\[|\]$/g, ""));
}

/** Whether `host` names this machine's loopback interface. */
function isLoopbackHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1") return true;
  return /^127(\.\d{1,3}){3}$/.test(host);
}

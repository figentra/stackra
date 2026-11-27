/**
 * Stackra file contract:
 * Purpose: `inspectionTarget(env)`, the database a developer inspection reads and the environment it reads it in:
 *          `STACKRA_ENVIRONMENT` (else `dev`) must be `dev` or `test` (the testbed), and in `dev` the connection
 *          (`DATABASE_DIRECT_URL`, else `DATABASE_URL`) must reach this machine: a loopback address, a socket, a
 *          one-label container name or a `.local`/`.localhost`/`.internal` name.
 * Boundary: pure over the environment it is given; it never connects and never prints the connection string, only
 *           its host. A deployed environment is refused by name, and a dev shell whose URL points elsewhere is refused
 *           too, so an unset `STACKRA_ENVIRONMENT` never lets an inspection reach a shared database.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: the local database only); ADR 0473 (decision 3: the direct URL);
 *                     STA-2906.
 */
import { InspectionRefusedError } from "#node/errors/inspection-refused.error";
import { INSPECTION_LIMITS } from "#node/constants/inspection-limits.constant";
import { directDatabaseUrl } from "#node/functions/direct-database-url.function";

/** A host name that stays on this machine or its container network. */
const LOCAL_HOST =
  /^(?:localhost|127(?:\.\d{1,3}){3}|::1|0\.0\.0\.0|host\.docker\.internal|[a-z0-9_-]+|.+\.(?:local|localhost|internal))$/i;

/**
 * The connection string and environment of an inspection.
 *
 * @param env - the environment, `process.env` by default.
 * @throws InspectionRefusedError for an environment other than `dev` or `test`, or a `dev` URL off this machine.
 * @throws Error when neither `DATABASE_DIRECT_URL` nor `DATABASE_URL` is set.
 * @example
 * inspectionTarget({ DATABASE_URL: "postgres://127.0.0.1:9500/notes" }); // { url: "postgres://…", environment: "dev" }
 */
export function inspectionTarget(env: Readonly<Record<string, string | undefined>> = process.env): {
  readonly url: string;
  readonly environment: string;
} {
  const environment = env["STACKRA_ENVIRONMENT"] || "dev";
  if (!(INSPECTION_LIMITS.environments as readonly string[]).includes(environment))
    throw new InspectionRefusedError(
      `a database inspection reads local dev and testbed databases only, not ${environment}`,
      "Run it on your machine (STACKRA_ENVIRONMENT unset or dev) or on the testbed (test)",
    );
  const url = directDatabaseUrl(env);
  if (environment === "dev") {
    const host = hostOf(url);
    if (host !== "" && !host.startsWith("/") && !LOCAL_HOST.test(host))
      throw new InspectionRefusedError(
        `in dev, a database inspection reads a database on this machine only, and ${host} is not local`,
        "Point DATABASE_URL at the local database (stackra dev), or set STACKRA_ENVIRONMENT=test on the testbed",
      );
  }
  return { url, environment };
}

/** The host of a Postgres connection string, without brackets; `''` when it names none (the default socket). */
function hostOf(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new InspectionRefusedError(
      "the database connection string is not a URL",
      "Set DATABASE_URL to postgres://user@host:port/database",
    );
  }
  // `?host=/var/run/postgresql` names a socket folder and wins over the authority, as libpq reads it
  const host = parsed.searchParams.get("host") ?? decodeURIComponent(parsed.hostname);
  return host.replace(/^\[(.*)\]$/, "$1");
}

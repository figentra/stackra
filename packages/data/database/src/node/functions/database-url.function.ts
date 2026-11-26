/**
 * Stackra file contract:
 * Purpose: `databaseUrl()`, the connection string `provideDatabaseUrl` was given, read when `#stackra/boot`
 *          connects, not when a module loads, so no load order between the Encore files and the server entry is
 *          assumed beyond each Encore file importing `./database` first (STA-1652).
 * Boundary: reads the provided value only; never logs it.
 * Runtime: node
 * Governing contract: ADR 0238; ADR 0014 (decision 5).
 */
import { DATABASE_URL_HOST } from "#node/constants/database-url-host.constant";

/**
 * The provided connection string.
 *
 * @throws Error when nothing provided one: the generated Encore file that loaded the server app did not import
 *         `./database` first.
 * @example
 * await PostgresDatabaseDriver.connect({ url: databaseUrl() });
 */
export function databaseUrl(): string {
  const url = DATABASE_URL_HOST.url;
  if (url === undefined)
    throw new Error(
      "no database url was provided: the generated stackra-encore/<member>/database.ts calls provideDatabaseUrl, " +
        'and every generated Encore file must import "./database" before the server app (STA-1652)',
    );
  return url;
}

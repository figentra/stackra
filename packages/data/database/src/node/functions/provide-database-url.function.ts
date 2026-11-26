/**
 * Stackra file contract:
 * Purpose: `provideDatabaseUrl`, which the runtime calls with the connection string of the service's own database
 *          before anything connects: the generated `stackra-encore/<member>/database.ts` passes its Encore
 *          `connectionString`, so `#stackra/boot` connects without importing the Encore program (STA-1652).
 * Boundary: replaces the previous value; never logs it.
 * Runtime: node
 * Governing contract: ADR 0238; ADR 0014 (decision 5); ADR 0091 and 0124 (Encore stays outside the service program).
 */
import { DATABASE_URL_HOST } from "#node/constants/database-url-host.constant";

/**
 * Provides the connection string `databaseUrl()` returns.
 *
 * @param url - the service database's connection string.
 * @example
 * provideDatabaseUrl(database.connectionString);
 */
export function provideDatabaseUrl(url: string): void {
  DATABASE_URL_HOST.url = url;
}

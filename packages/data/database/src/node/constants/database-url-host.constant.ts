/**
 * Stackra file contract:
 * Purpose: `DATABASE_URL_HOST`, the connection string the runtime provides for this service's own database, held
 *          between `provideDatabaseUrl` (the generated Encore `database.ts`) and `databaseUrl()` (`#stackra/boot`).
 * Boundary: internal; written only by `provideDatabaseUrl`. One database per service and process (ADR 0238), like
 *           `HOLD_HOST`. Never logged.
 * Runtime: node
 * Governing contract: ADR 0238 (one logical database per service); ADR 0014 (decision 5: the runtime provides the
 *                     connection); STA-1652.
 */

/** The provided connection string, or undefined before `provideDatabaseUrl`. */
export const DATABASE_URL_HOST: { url: string | undefined } = { url: undefined };

/**
 * Stackra file contract:
 * Purpose: `ENCORE_APP_IMPORT`, the line a generated `.stackra/encore/<member>/*.ts` file imports the server app with
 *          (`.stackra/entry/server.ts`, two folders up), shared by the cron and queue emitters.
 * Boundary: a constant string; the path lives in generated output, not in this member, so it is not an alias.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 10); ADR 0266 (decision 4.3).
 */

/** The generated server entry, relative to `.stackra/encore/<member>/`. */
const SERVER_ENTRY = "../../entry/server";

/** The import line of the server app in a generated Encore file. */
export const ENCORE_APP_IMPORT = `import { app } from "${SERVER_ENTRY}";`;

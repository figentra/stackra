/**
 * Stackra file contract:
 * Purpose: `ENCORE_APP_IMPORT`, the line a generated `stackra-encore/<member>/*.ts` file imports the server app with
 *          (`.stackra/entry/server.ts`, two folders up and into `.stackra`), shared by the Encore emitters.
 * Boundary: a constant string; the path lives in generated output, not in this member, so it is not an alias. Encore
 *           follows the import into the dot folder; it skips dot folders only when it discovers services.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 10); ADR 0266 (decision 4.3); ADR 0091 (decision 2 as amended 2026-11-10).
 */

/** The generated server entry, relative to `stackra-encore/<member>/`. */
const SERVER_ENTRY = "../../.stackra/entry/server";

/** The import line of the server app in a generated Encore file. */
export const ENCORE_APP_IMPORT = `import { app } from "${SERVER_ENTRY}";`;

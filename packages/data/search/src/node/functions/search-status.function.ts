/**
 * Stackra file contract:
 * Purpose: `searchStatus()`, the half of the search runner `stackra search:status` calls: every row of the member's
 *          index registry (`search.indexes`), by model then scope.
 * Boundary: reads only; the connection string is the `DATABASE_URL` the member's runway and config put in the
 *           environment, never an argument. The registry holds states and counts, never row data.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0282 (decision 3: the CLI loads a member's
 *                     runner).
 */
import { PostgresDatabaseDriver } from "@stackra/database/node";

import type { SearchIndexStatus } from "#core/types/search-index-status.type";
import { SearchIndexRegistry } from "#node/services/search-index-registry.service";

/**
 * Reads the index registry.
 *
 * @throws Error when `DATABASE_URL` is not set or Postgres refuses the connection.
 * @example
 * for (const index of await searchStatus()) console.log(index.model, index.state, index.docCount);
 */
export async function searchStatus(): Promise<readonly SearchIndexStatus[]> {
  const url = process.env["DATABASE_URL"];
  if (url === undefined || url === "") throw new Error("DATABASE_URL is not set for this member");
  const database = await PostgresDatabaseDriver.connect({ url });
  try {
    return await new SearchIndexRegistry(database).list();
  } finally {
    await database.close();
  }
}

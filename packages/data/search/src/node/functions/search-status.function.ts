/**
 * Stackra file contract:
 * Purpose: `searchStatus()`, the half of the search runner `stackra search:status` calls: every row of the member's
 *          index registry (`search.indexes`), by model then scope.
 * Boundary: reads only; the connection string is `directDatabaseUrl()` of @stackra/database/node
 *           (`DATABASE_DIRECT_URL`, else `DATABASE_URL`, as the member's runway and config put them in the environment),
 *           never an argument: a CLI runs past the pooling proxy (ADR 0473). The registry holds states and counts, never row data.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0282 (decision 3: the CLI loads a member's
 *                     runner); ADR 0473 (decision 3: the direct URL).
 */
import { PostgresDatabaseDriver, directDatabaseUrl } from "@stackra/database/node";

import type { SearchIndexStatus } from "#core/types/search-index-status.type";
import { SearchIndexRegistry } from "#node/services/search-index-registry.service";

/**
 * Reads the index registry.
 *
 * @throws Error when neither `DATABASE_DIRECT_URL` nor `DATABASE_URL` is set, or Postgres refuses the connection.
 * @example
 * for (const index of await searchStatus()) console.log(index.model, index.state, index.docCount);
 */
export async function searchStatus(): Promise<readonly SearchIndexStatus[]> {
  const url = directDatabaseUrl();
  const database = await PostgresDatabaseDriver.connect({ url });
  try {
    return await new SearchIndexRegistry(database).list();
  } finally {
    await database.close();
  }
}

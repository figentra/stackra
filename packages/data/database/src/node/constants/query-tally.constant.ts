/**
 * Stackra file contract:
 * Purpose: `QUERY_TALLY`, the async-local frame holding the innermost `QueryTally` of the running work, which the
 *          observed ORM logger increments and `tallyQueries` opens.
 * Boundary: internal to this package's node and testing entries; one storage per process. Outside every frame the
 *           store is undefined and nothing is counted.
 * Runtime: node
 * Governing contract: data-layer gaps scale-performance 8 and model-orm 12 (stackra-282, STA-1400).
 */
import { AsyncLocalStorage } from "node:async_hooks";

import type { QueryTally } from "#node/types/query-tally.type";

/** The running work's innermost tally. */
export const QUERY_TALLY = new AsyncLocalStorage<QueryTally>();

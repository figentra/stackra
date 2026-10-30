/**
 * Stackra file contract:
 * Purpose: `ANALYTICS_INGEST_PATH`, the path of the analytics service's ingest action under the public API origin
 *          (ADR 0483 decision 1): the `relay` driver posts there and `IngestAnalyticsBatchAction` declares it.
 * Boundary: a constant in the leaf entry, shared by the client driver and the server action so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0483 (decisions 1 and 4); ADR 0294 (decision 21: an endpoint override).
 */

/**
 * The ingest path, appended to `AnalyticsConfig.ingestOrigin`.
 *
 * @example
 * await fetch(`${apiOrigin}${ANALYTICS_INGEST_PATH}`, { method: "POST", body });
 */
export const ANALYTICS_INGEST_PATH = "/analytics/batches";

/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/analytics until `stackra gen` writes the entry barrels
 *          (STA-339): `RelayTrackedAnalyticsListener`, which sends the pipeline's `analytics.tracked.v1` events to the
 *          server destinations, and
 *          `EraseAnalyticsPersonListener`, which deletes an erased subject's person at the vendor (STA-1582), and the
 *          analytics service's relay ingest (STA-1624): `IngestAnalyticsBatchAction` with its input, output and
 *          `AnalyticsBatchPermissions`, the `AnalyticsBatchAccepted` event and `FanOutAnalyticsListener`.
 * Boundary: names each re-export and declares nothing. Server only: browsers and React Native never import it.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; STA-1512; STA-1582; ADR 0483.
 */
export { AnalyticsBatchPermissions } from "#node/access/analytics-batch.permissions";
export { IngestAnalyticsBatchAction } from "#node/actions/ingest-analytics-batch.action";
export { AnalyticsBatchAccepted } from "#node/events/analytics-batch-accepted.event";
export { EraseAnalyticsPersonListener } from "#node/listeners/erase-analytics-person.listener";
export { FanOutAnalyticsListener } from "#node/listeners/fan-out-analytics.listener";
export { RelayTrackedAnalyticsListener } from "#node/listeners/relay-tracked-analytics.listener";
export { IngestAnalyticsBatchInput } from "#node/schemas/ingest-analytics-batch-input.schema";
export { IngestAnalyticsBatchOutput } from "#node/schemas/ingest-analytics-batch-output.schema";

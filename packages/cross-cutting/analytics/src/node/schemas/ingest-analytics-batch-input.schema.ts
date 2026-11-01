/**
 * Stackra file contract:
 * Purpose: `IngestAnalyticsBatchInput`, the body the `relay` driver posts to the ingest action: one batch of envelope
 *          v2 deliveries (ADR 0483 decisions 1 and 3).
 * Boundary: the trust boundary of the analytics service: every delivery is checked against `ANALYTICS_DELIVERY_SCHEMA`
 *           and a batch holds 1 to 100 of them (the client's `flushAt` default is 20, its `bufferLimit` caps a beacon
 *           flush), so an oversized or malformed body is refused before the action runs.
 * Runtime: node
 * Governing contract: ADR 0483 (decision 3); ADR 0095 as amended (the `@Field(zod)` escape hatch); ADR 0305.
 */
import { Field, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import { ANALYTICS_DELIVERY_SCHEMA } from "#core/constants/analytics-delivery-schema.constant";

/** The most deliveries one batch may hold. */
const BATCH_LIMIT = 100;

/** The deliveries of one relayed batch. */
const DELIVERIES = z.array(ANALYTICS_DELIVERY_SCHEMA).min(1).max(BATCH_LIMIT);

/** One batch of relayed analytics deliveries. */
export class IngestAnalyticsBatchInput extends Schema {
  /** The deliveries, in the order the client captured them. */
  // reason: the envelope is a package interface with no `X$`; its zod schema already holds its rules
  @Field(DELIVERIES)
  deliveries!: AnalyticsDelivery[];
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[IngestAnalyticsBatchInput, z.object({ deliveries: DELIVERIES })]]);

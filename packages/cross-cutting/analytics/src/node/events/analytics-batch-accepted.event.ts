/**
 * Stackra file contract:
 * Purpose: `AnalyticsBatchAccepted` (`analytics.batch.accepted.v1`), one destination's share of a relayed batch that
 *          the call's verified consent snapshot allows (ADR 0483 decisions 2 and 4): the destination instance, the
 *          snapshot id and the deliveries, written through the outbox by the ingest action.
 * Boundary: one event per destination, so the outbox retries each destination alone; consumed inside the analytics
 *           service by `FanOutAnalyticsListener`. The deliveries are the validated envelope minus `denyProperties`;
 *           the snapshot id lets an audit show the decision that allowed the send (ADR 0472 decision 4).
 * Runtime: node
 * Governing contract: ADR 0483 (decisions 2 and 4); ADR 0472 (decision 4); ADR 0141 (event names); ADR 0305.
 */
import { IntegrationEvent } from "@stackra/events";
import { Field, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import { ANALYTICS_DELIVERY_SCHEMA } from "#core/constants/analytics-delivery-schema.constant";

/**
 * One destination's share of an ingested batch.
 *
 * @example
 * await ctx.publish(AnalyticsBatchAccepted.create({ destination: "default", snapshotId, deliveries }));
 */
export class AnalyticsBatchAccepted extends IntegrationEvent({ name: "batch.accepted" }) {
  /** The deliveries this destination takes, in capture order. */
  // reason: the envelope is a package interface with no `X$`; its zod schema already holds its rules
  @Field(z.array(ANALYTICS_DELIVERY_SCHEMA).min(1))
  deliveries!: AnalyticsDelivery[];

  /** `default` (the `driver` instance) or an instance name from `AnalyticsConfig.drivers`. */
  destination!: string;

  /** The consent snapshot that granted the destination's category (`csn_...`). */
  snapshotId!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AnalyticsBatchAccepted,
    z.object({
      destination: z.string().min(1),
      snapshotId: z.string().min(1),
      deliveries: z.array(ANALYTICS_DELIVERY_SCHEMA).min(1),
    }),
  ],
]);

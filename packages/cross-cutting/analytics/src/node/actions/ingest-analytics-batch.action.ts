/**
 * Stackra file contract:
 * Purpose: `IngestAnalyticsBatchAction`, `analytics.analytics_batch.ingest@1` on `POST /analytics/batches`: the
 *          analytics service's ingest endpoint (ADR 0483 decisions 2 to 4). It takes a batch the `relay` driver posted,
 *          keeps the deliveries the call's verified consent snapshot speaks for, strips `denyProperties`, and publishes
 *          one `AnalyticsBatchAccepted` through the outbox per destination whose category the snapshot grants.
 * Boundary: public area, open to anonymous visitors and signed-in users; not an MCP tool. The pipeline verified the
 *           `Stackra-Consent` header before `handle` (`ctx.consent()`, ADR 0472 decision 3), so the action never
 *           verifies a token itself. An unverified snapshot publishes nothing; a delivery whose `anonymousId` and
 *           `userId` are both not the snapshot's subject is dropped; a destination takes what its category, `include`
 *           and `exclude` allow (`identify` and `group` reach every granted destination, as in the client). Only the
 *           validated envelope travels on: no request address, user agent or header. A refusal is an answer with
 *           counts, never an error, so the client never retries it. Sends nothing to a vendor itself.
 * Runtime: node
 * Governing contract: ADR 0483 (decisions 2, 3 and 4); ADR 0472 (decisions 3 and 4); ADR 0298 (decision 1); ADR 0294
 *                     (decisions 16 and 21); ADR 0082 (the public area).
 */
import { Action, Idempotency } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import { ActorKind, ApiArea, HttpMethod } from "@stackra/contracts";

import type { AnalyticsConfig } from "#config/analytics.config";
import { ANALYTICS_INGEST_PATH } from "#contracts/constants/analytics-ingest-path.constant";
import { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import { ANALYTICS_DEFAULT_DESTINATION } from "#core/constants/analytics-default-destination.constant";
import type { AnalyticsDestination } from "#core/types/analytics-destination.type";
import { AnalyticsBatchAccepted } from "#node/events/analytics-batch-accepted.event";
import type { IngestAnalyticsBatchInput } from "#node/schemas/ingest-analytics-batch-input.schema";
import { IngestAnalyticsBatchOutput } from "#node/schemas/ingest-analytics-batch-output.schema";

/** Whether `destination` takes `delivery`: `identify` and `group` always, an event by the include and exclude lists. */
function takes(destination: AnalyticsDestination, delivery: AnalyticsDelivery): boolean {
  if ((delivery.kind ?? AnalyticsDeliveryKind.Track) !== AnalyticsDeliveryKind.Track) return true;
  if (destination.exclude?.includes(delivery.name)) return false;
  const include = destination.include ?? [];
  return include.length === 0 || include.includes(delivery.name);
}

/**
 * Takes a relayed analytics batch and hands each granted destination its share.
 *
 * @example
 * await action.handle(IngestAnalyticsBatchInput.create({ deliveries }), ctx); // { accepted: 20, dropped: 0 }
 */
export class IngestAnalyticsBatchAction extends Action({
  key: "analytics_batch.ingest",
  actors: [ActorKind.Anonymous, ActorKind.User],
  area: ApiArea.Public,
  endpoint: { method: HttpMethod.Post, path: ANALYTICS_INGEST_PATH },
  // reason: every delivery carries its event id, which each destination dedups on, so a repeat is harmless
  idempotency: Idempotency.Optional,
  // reason: an agent has no visitor's analytics to relay
  tool: false,
}) {
  /** The destinations, their categories and routing, and `denyProperties`. */
  private readonly config: AnalyticsConfig;

  /**
   * @param config - the analytics configuration of the analytics service.
   */
  constructor(config: AnalyticsConfig) {
    super();
    this.config = config;
  }

  /** Publishes each granted destination's share of `input`; answers how many went on and how many were dropped. */
  async handle(
    input: IngestAnalyticsBatchInput,
    ctx: ActionContext,
  ): Promise<IngestAnalyticsBatchOutput> {
    const total = input.deliveries.length;
    const consent = await ctx.consent();
    if (!consent.verified)
      return IngestAnalyticsBatchOutput.create({ accepted: 0, dropped: total });
    const denied = new Set(this.config.denyProperties);
    const bound = input.deliveries
      .filter(
        (delivery) =>
          delivery.anonymousId === consent.subject || delivery.userId === consent.subject,
      )
      .map((delivery) => ({
        ...delivery,
        properties: Object.fromEntries(
          Object.entries(delivery.properties).filter(([name]) => !denied.has(name)),
        ),
      }));
    const destinations: readonly AnalyticsDestination[] =
      this.config.destinations.length > 0
        ? this.config.destinations
        : [{ driver: ANALYTICS_DEFAULT_DESTINATION, category: this.config.consentCategory }];
    const accepted = new Set<AnalyticsDelivery>();
    for (const destination of destinations) {
      if (!consent.granted.includes(destination.category)) continue;
      const deliveries = bound.filter((delivery) => takes(destination, delivery));
      if (deliveries.length === 0) continue;
      for (const delivery of deliveries) accepted.add(delivery);
      await ctx.publish(
        AnalyticsBatchAccepted.create({
          destination: destination.driver,
          snapshotId: consent.snapshotId,
          deliveries,
        }),
      );
    }
    return IngestAnalyticsBatchOutput.create({
      accepted: accepted.size,
      dropped: total - accepted.size,
    });
  }
}

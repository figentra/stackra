/**
 * Stackra file contract:
 * Purpose: `crossRegionRecords`, which picks from a batch of committed records the ones the relay hands to the
 *          `RegionBus`: occurrences of an `IntegrationEvent({ crossRegion: true })`.
 * Boundary: pure; reads the kind registry only. It refuses (throws) a cross-region occurrence that carries a tenant,
 *           because tenant data never leaves its region (ADR 0353 decision 5): such an event is a modelling error,
 *           not a record to drop quietly. The relay that calls it lives in `@stackra/outbox`.
 * Runtime: isomorphic
 * Governing contract: ADR 0353 (decision 5); ADR 0078 (decision 4); STA-1268.
 */
import { kindOf } from "@stackra/container";

import type { RecordedEvent } from "#contracts/index";

/**
 * The records to send to the other regions, in their order.
 *
 * @throws TypeError when a cross-region record carries `meta.tenantId`.
 * @example
 * await outbox.publish(batch);
 * await regionBus.send(crossRegionRecords(batch));
 */
export function crossRegionRecords<R extends RecordedEvent>(records: readonly R[]): R[] {
  return records.filter((record) => {
    const kind = kindOf(record.event.constructor);
    if (kind?.kind !== "integration_event" || kind.options["crossRegion"] !== true) return false;
    if (record.meta.tenantId !== undefined)
      throw new TypeError(
        `${record.event.constructor.name} is crossRegion but event ${record.meta.id} carries tenant data; only platform events cross regions (ADR 0353)`,
      );
    return true;
  });
}

/**
 * Stackra file contract:
 * Purpose: `warehouseBatches`, which splits a page of the change log into warehouse partitions: one `WarehouseBatch`
 *          per model, scope and UTC day, each keeping log order.
 * Boundary: a pure function; batches come out in the order their first record appears.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the warehouse sink's `scope=/model=/dt=` layout).
 */
import type { ChangeRecord } from "@stackra/outbox/contracts";

import type { WarehouseBatch } from "#contracts/types/warehouse-batch.type";

/**
 * The partitions of `records`.
 *
 * @example
 * for (const batch of warehouseBatches(await feed.read(after, ["Product"], 1000))) await sink.write(batch, options);
 */
export function warehouseBatches(records: readonly ChangeRecord[]): WarehouseBatch[] {
  const batches = new Map<string, { batch: WarehouseBatch; records: ChangeRecord[] }>();
  for (const record of records) {
    const day = record.occurredAt.toISOString().slice(0, 10);
    const key = JSON.stringify([record.change.model, record.scope?.id ?? null, day]);
    let entry = batches.get(key);
    if (entry === undefined) {
      const list: ChangeRecord[] = [];
      entry = {
        records: list,
        batch: {
          model: record.change.model,
          ...(record.scope === undefined ? {} : { scope: record.scope }),
          day,
          records: list,
        },
      };
      batches.set(key, entry);
    }
    entry.records.push(record);
  }
  return [...batches.values()].map((entry) => entry.batch);
}

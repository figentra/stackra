/**
 * Stackra file contract:
 * Purpose: unit tests of `warehousePath`: the Hive layout key, `_platform` for a platform write, encoded segments, a
 *          trimmed or empty prefix, and the refusal of an empty batch.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 and ADR 0190 (2026-10-29 amendments).
 */
import type { ScopeRef } from "@stackra/contracts";
import { RowChangeKind } from "@stackra/outbox/contracts";
import type { ChangeRecord } from "@stackra/outbox/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { WarehouseBatch } from "#contracts/types/warehouse-batch.type";
import { warehousePath } from "#core/functions/warehouse-path.function";

/** A change record at `position`. */
function record(position: string): ChangeRecord {
  return {
    position,
    change: { model: "Order", id: "ord_1", kind: RowChangeKind.Created, fields: [] },
    meta: {},
    occurredAt: new Date("2026-10-29T00:00:00.000Z"),
  };
}

const SCOPE: ScopeRef = { id: "scp_acme" as ScopeRef["id"], path: "platform.acme" };

describe(warehousePath, () => {
  it("writes the scope, model and day partitions and the position range", () => {
    const batch: WarehouseBatch = {
      model: "Order",
      scope: SCOPE,
      day: "2026-10-29",
      records: [record("7"), record("42")],
    };
    expect(warehousePath("warehouse/", batch)).toBe(
      "warehouse/scope=scp_acme/model=Order/dt=2026-10-29/7-42.parquet",
    );
  });

  it("puts a platform write under _platform and encodes the segments", () => {
    const batch: WarehouseBatch = { model: "Order", day: "2026-10-29", records: [record("a/b")] };
    expect(warehousePath("", batch)).toBe(
      "scope=_platform/model=Order/dt=2026-10-29/a%2Fb-a%2Fb.parquet",
    );
  });

  it("refuses an empty batch", () => {
    expect(() => warehousePath("w", { model: "Order", day: "2026-10-29", records: [] })).toThrow(
      TypeError,
    );
  });
});

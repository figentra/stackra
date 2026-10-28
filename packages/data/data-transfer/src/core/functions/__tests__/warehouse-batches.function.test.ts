/**
 * Stackra file contract:
 * Purpose: unit tests of `warehouseBatches`: a page of the change log splits by model, scope and UTC day, in the order
 *          each partition first appears, keeping log order inside each batch.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 and ADR 0190 (2026-10-29 amendments).
 */
import type { ScopeRef } from "@stackra/contracts";
import { RowChangeKind } from "@stackra/outbox/contracts";
import type { ChangeRecord } from "@stackra/outbox/contracts";
import { describe, expect, it } from "@stackra/testing";

import { warehouseBatches } from "#core/functions/warehouse-batches.function";

const ACME: ScopeRef = { id: "scp_acme" as ScopeRef["id"], path: "platform.acme" };

/** A change record at `position` of `model` on `iso`, in `scope`. */
function record(position: string, model: string, iso: string, scope?: ScopeRef): ChangeRecord {
  return {
    position,
    change: { model, id: `${model}_${position}`, kind: RowChangeKind.Created, fields: [] },
    meta: {},
    occurredAt: new Date(iso),
    ...(scope === undefined ? {} : { scope }),
  };
}

describe(warehouseBatches, () => {
  it("splits by model, scope and day", () => {
    const batches = warehouseBatches([
      record("1", "Order", "2026-10-28T23:59:59.000Z", ACME),
      record("2", "Order", "2026-10-29T00:00:00.000Z", ACME),
      record("3", "Product", "2026-10-29T01:00:00.000Z", ACME),
      record("4", "Order", "2026-10-29T02:00:00.000Z", ACME),
      record("5", "Order", "2026-10-29T03:00:00.000Z"),
    ]);
    expect(
      batches.map((batch) => [
        batch.model,
        batch.scope?.id,
        batch.day,
        batch.records.map((r) => r.position),
      ]),
    ).toEqual([
      ["Order", "scp_acme", "2026-10-28", ["1"]],
      ["Order", "scp_acme", "2026-10-29", ["2", "4"]],
      ["Product", "scp_acme", "2026-10-29", ["3"]],
      ["Order", undefined, "2026-10-29", ["5"]],
    ]);
    expect("scope" in (batches[3] ?? {})).toBe(false);
  });

  it("returns nothing for an empty page", () => {
    expect(warehouseBatches([])).toEqual([]);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `warehouseSheet`: the change columns, one sorted column per captured field, after values (and
 *          before values for a delete), number and boolean columns kept, mixed and object values as text, a model with
 *          no captured values, and the refusal of a field named like a change column.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 and ADR 0190 (2026-10-29 amendments).
 */
import type { ScopeRef } from "@stackra/contracts";
import { RowChangeKind } from "@stackra/outbox/contracts";
import type { ChangeRecord, RowChange } from "@stackra/outbox/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { WarehouseBatch } from "#contracts/types/warehouse-batch.type";
import { warehouseSheet } from "#core/functions/warehouse-sheet.function";

const AT = new Date("2026-10-29T10:00:00.000Z");
const SCOPE: ScopeRef = { id: "scp_acme" as ScopeRef["id"], path: "platform.acme" };

/** A record at `position` holding `change`. */
function record(position: string, change: RowChange): ChangeRecord {
  return { position, change, meta: {}, occurredAt: AT, scope: SCOPE };
}

/** The rows of the sheet of `records`. */
async function rowsOf(records: ChangeRecord[]): Promise<(readonly TabularCell[])[]> {
  const batch: WarehouseBatch = { model: "Order", scope: SCOPE, day: "2026-10-29", records };
  const rows: (readonly TabularCell[])[] = [];
  for await (const row of warehouseSheet(batch).rows) rows.push(row);
  return rows;
}

describe(warehouseSheet, () => {
  it("writes the change columns and the captured values", async () => {
    const rows = await rowsOf([
      record("1", {
        model: "Order",
        id: "ord_1",
        kind: RowChangeKind.Created,
        fields: ["total", "paid", "note", "lines"],
        after: { total: 5, paid: true, note: "hi", lines: [1] },
      }),
      record("2", {
        model: "Order",
        id: "ord_1",
        kind: RowChangeKind.Updated,
        fields: ["note"],
        after: { note: 3 },
      }),
      record("3", {
        model: "Order",
        id: "ord_2",
        kind: RowChangeKind.Deleted,
        fields: [],
        before: { total: 7 },
      }),
    ]);
    expect(rows).toEqual([
      [
        "_position",
        "_occurred_at",
        "_kind",
        "_id",
        "_fields",
        "_scope_path",
        "lines",
        "note",
        "paid",
        "total",
      ],
      [
        "1",
        AT,
        "created",
        "ord_1",
        '["total","paid","note","lines"]',
        "platform.acme",
        "[1]",
        "hi",
        true,
        5,
      ],
      ["2", AT, "updated", "ord_1", '["note"]', "platform.acme", null, "3", null, null],
      ["3", AT, "deleted", "ord_2", "[]", "platform.acme", null, null, null, 7],
    ]);
  });

  it("writes only the change columns for a model without captured values", async () => {
    const rows = await rowsOf([
      record("1", { model: "Order", id: "ord_1", kind: RowChangeKind.Updated, fields: ["note"] }),
    ]);
    expect(rows[0]).toEqual([
      "_position",
      "_occurred_at",
      "_kind",
      "_id",
      "_fields",
      "_scope_path",
    ]);
  });

  it("refuses a field named like a change column", () => {
    const batch: WarehouseBatch = {
      model: "Order",
      day: "2026-10-29",
      records: [
        record("1", {
          model: "Order",
          id: "ord_1",
          kind: RowChangeKind.Created,
          fields: ["_id"],
          after: { _id: "x" },
        }),
      ],
    };
    expect(() => warehouseSheet(batch)).toThrow("Order._id");
  });
});

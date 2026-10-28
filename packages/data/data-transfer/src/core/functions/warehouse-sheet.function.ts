/**
 * Stackra file contract:
 * Purpose: `warehouseSheet`, the rows a warehouse file holds for a batch: one row per change with the change columns
 *          `_position`, `_occurred_at`, `_kind`, `_id`, `_fields` (a JSON array) and `_scope_path`, then one column
 *          per captured field, holding the value after the write (before it, for a delete).
 * Boundary: a pure function. Value columns are the captured fields of every record, sorted; a column whose values are
 *           all numbers or all booleans keeps that type, any other is text (objects and arrays as JSON). A model that
 *           captures no values gets the change columns only. A captured field named like a change column is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the warehouse sink); ADR 0078 and ADR 0221
 *                     (2026-10-28 amendment: values are opt-in and never encrypted or classified).
 */
import type { RowChange } from "@stackra/outbox/contracts";

import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import type { WarehouseBatch } from "#contracts/types/warehouse-batch.type";

/** The change columns every warehouse file starts with. */
const CHANGE_COLUMNS = [
  "_position",
  "_occurred_at",
  "_kind",
  "_id",
  "_fields",
  "_scope_path",
] as const;

/** The values a change's row holds: after the write, or before it for a delete. */
function valuesOf(change: RowChange): Readonly<Record<string, unknown>> {
  return change.after ?? change.before ?? {};
}

/** The cell of `value` in a column that keeps its type (`keep`) or is text. */
function cellOf(value: unknown, kind: "keep" | "text"): TabularCell {
  if (value === null || value === undefined) return null;
  if (kind === "keep" || typeof value === "string") return value as TabularCell;
  return JSON.stringify(value);
}

/**
 * The sheet of `batch`, header first.
 *
 * @throws TypeError when a captured field is named like a change column.
 * @example
 * await sink.writeStream(path, new ParquetWriterDriver().write([warehouseSheet(batch)]));
 */
export function warehouseSheet(batch: WarehouseBatch): TabularSheet {
  const fields = [
    ...new Set(batch.records.flatMap((record) => Object.keys(valuesOf(record.change)))),
  ];
  fields.sort();
  const clash = fields.find((field) => (CHANGE_COLUMNS as readonly string[]).includes(field));
  if (clash !== undefined)
    throw new TypeError(
      `${batch.model}.${clash} is named like a warehouse change column; rename it or exclude it from capture`,
    );
  const kinds = fields.map((field) => {
    const types = new Set(
      batch.records
        .map((record) => valuesOf(record.change)[field])
        .filter((value) => value !== null && value !== undefined)
        .map((value) => typeof value),
    );
    return types.size === 1 && (types.has("number") || types.has("boolean"))
      ? ("keep" as const)
      : ("text" as const);
  });
  const rows: (readonly TabularCell[])[] = [[...CHANGE_COLUMNS, ...fields]];
  for (const record of batch.records) {
    const values = valuesOf(record.change);
    rows.push([
      record.position,
      record.occurredAt,
      record.change.kind,
      record.change.id,
      JSON.stringify(record.change.fields),
      record.scope?.path ?? null,
      ...fields.map((field, column) => cellOf(values[field], kinds[column] ?? "text")),
    ]);
  }
  return { name: batch.model, rows };
}

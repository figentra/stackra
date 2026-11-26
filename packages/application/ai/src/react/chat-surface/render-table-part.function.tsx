/**
 * Stackra file contract:
 * Purpose: `renderTablePart`, the default renderer of a `data-tamo-table` part: a @stackra/ui `Table` with the part's
 *          columns and every row it holds, each number written by its column type (`money`, `percent`, other numbers)
 *          and a `date` column as a `DateLabel`; any other value is shown as is.
 * Boundary: pure over the part's data, read defensively: without a column (an id and a label each) it draws nothing,
 *           and a row that is not an object is skipped. It never pages or sorts: the rows are what the part holds.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0507 (Ask Tamo); ADR 0165 (UI through @stackra/ui).
 */
import type { TableColumn } from "@stackra/ui/contracts";
import { DateLabel, NumberValue, PercentValue, Table } from "@stackra/ui/react";
import type { ReactNode } from "react";

import type { TamoTableColumn } from "#contracts/types/tamo-table-column.type";

/** One row as the table keys it: its position, and the part's row. */
interface Row {
  readonly id: string;
  readonly cells: Readonly<Record<string, unknown>>;
}

/** The column types whose values line up at the end, as numbers do. */
const NUMERIC = new Set(["number", "integer", "money", "percent"]);

/** The value as an object's fields, else undefined. */
const fieldsIn = (value: unknown): Readonly<Record<string, unknown>> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;

/** The part's columns that carry a string id and label. */
const columnsOf = (value: unknown): TamoTableColumn[] =>
  Array.isArray(value)
    ? value.flatMap((entry: unknown) => {
        const column = fieldsIn(entry);
        return typeof column?.["id"] === "string" && typeof column["label"] === "string"
          ? [
              {
                id: column["id"],
                label: column["label"],
                type: typeof column["type"] === "string" ? column["type"] : undefined,
              },
            ]
          : [];
      })
    : [];

/** One cell's value written by its column type. */
const cellOf = (value: unknown, type: string | undefined): ReactNode => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    if (type === "percent") return <PercentValue value={value} fractionDigits={1} />;
    // shortcut: a money column carries no currency, so it is a two-decimal number; add one to the part to show it.
    if (type === "money")
      return (
        <NumberValue
          value={value}
          options={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        />
      );
    return <NumberValue value={value} />;
  }
  if ((type === "date" || type === "datetime") && typeof value === "string")
    return <DateLabel date={value} isRelative={false} />;
  return typeof value === "string" || typeof value === "boolean" ? String(value) : "";
};

/**
 * A table part as a Table, or null when it has no columns or no rows list.
 *
 * @example
 * renderTablePart({ columns: [{ id: "total", label: "Total", type: "money" }], rows: [{ total: 12.5 }] })
 */
export function renderTablePart(data: unknown): ReactNode {
  const fields = fieldsIn(data);
  const columns = columnsOf(fields?.["columns"]);
  const entries: unknown = fields?.["rows"];
  if (columns.length === 0 || !Array.isArray(entries)) return null;
  const types = new Map(columns.map((column) => [column.id, column.type]));
  const rows: Row[] = entries.flatMap((entry: unknown, index) => {
    const cells = fieldsIn(entry);
    return cells === undefined ? [] : [{ id: String(index), cells }];
  });
  const tableColumns: TableColumn[] = columns.map((column) => ({
    id: column.id,
    label: column.label,
    align: column.type !== undefined && NUMERIC.has(column.type) ? "end" : undefined,
  }));
  return (
    <Table<Row>
      // the part names no table, so its headings name it
      label={columns.map((column) => column.label).join(", ")}
      columns={tableColumns}
      items={rows}
      renderCell={(row, column) => cellOf(row.cells[column.id], types.get(column.id))}
    />
  );
}

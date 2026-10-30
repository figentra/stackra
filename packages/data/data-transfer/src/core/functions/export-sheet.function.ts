/**
 * Stackra file contract:
 * Purpose: `exportSheet`, the sheet a tenant export or backup writes for one model's records: the requested columns
 *          minus every column the model classifies, except the classes the export opts in; a `credential` column is
 *          never written, even when opted in (ADR 0494 rule 2).
 * Boundary: a pure function. The caller passes the model's field classes (`Classified.members(Model)`), so this package
 *           reads no decorator and depends on no validation package. A cell keeps a string, number, boolean or null and
 *           holds any other value as JSON; a missing value is null.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (tabular export); ADR 0134 (classification); ADR 0494 (credential is never exported).
 */
import { DataClassification } from "@stackra/contracts";

import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";

/** The cell of `value`. */
function cellOf(value: unknown): TabularCell {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return value;
  return JSON.stringify(value);
}

/**
 * The sheet of `records`, header first, without the columns the export may not hold.
 *
 * @param records - the rows, as plain objects keyed by field.
 * @param options - the sheet name, the requested columns in order, the model's field classes, and the classes the
 *   export opts in (none by default).
 * @example
 * exportSheet(connections, {
 *   name: "connections",
 *   columns: ["id", "provider", "accessToken"],
 *   classes: Classified.members(Connection),
 * }); // header ["id", "provider"]: accessToken is a credential
 */
export function exportSheet(
  records: Iterable<Readonly<Record<string, unknown>>>,
  options: {
    readonly name: string;
    readonly columns: readonly string[];
    readonly classes: ReadonlyMap<string | symbol, DataClassification>;
    readonly include?: readonly DataClassification[];
  },
): TabularSheet {
  const include = new Set(options.include ?? []);
  const columns = options.columns.filter((column) => {
    const classification = options.classes.get(column);
    if (classification === undefined) return true;
    // A provider secret never leaves through an export, whatever the export opts in (ADR 0494).
    if (classification === DataClassification.Credential) return false;
    return include.has(classification);
  });
  const rows: (readonly TabularCell[])[] = [columns];
  for (const record of records) rows.push(columns.map((column) => cellOf(record[column])));
  return { name: options.name, rows };
}

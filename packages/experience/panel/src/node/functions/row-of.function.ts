/**
 * Stackra file contract:
 * Purpose: `rowOf(service, record, fields?)`, one record of a generated read as the resource's row: the service's own
 *          `toRow(record)` when it declares one, else the row's fields picked by name, else the record's own fields.
 * Boundary: pure; reads only the record's own properties. Gen refuses a row field the model lacks unless the service
 *           has `toRow`, so a picked field always exists on the model.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 1: the row is the list output's item); STA-1971.
 */

/**
 * The row of `record`.
 *
 * @example
 * rowOf(accounts, account, ["memberId", "tier"]); // { memberId: "mbr_…", tier: "gold" }
 */
export function rowOf(
  service: object,
  record: object,
  fields?: readonly string[],
): Readonly<Record<string, unknown>> {
  const present = (service as { toRow?: unknown }).toRow;
  if (typeof present === "function")
    return present.call(service, record) as Readonly<Record<string, unknown>>;
  const values = record as Readonly<Record<string, unknown>>;
  return fields === undefined
    ? { ...values }
    : Object.fromEntries(fields.map((field) => [field, values[field]]));
}

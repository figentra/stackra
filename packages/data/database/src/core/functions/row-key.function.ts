/**
 * Stackra file contract:
 * Purpose: `rowKey(row, fields)`, the comparable key of a row by the fields `upsert` matches on: the same key for an
 *          input row and the stored row it names, whether a field holds a value, a date or a linked row.
 * Boundary: internal to `CrudService.upsert`. A date keys by its ISO instant, a linked row (an object with an `id`)
 *           by its id, anything else by its string form; a missing or null field gives no key.
 * Runtime: node
 * Governing contract: data-layer gap mo9 (stackra-280).
 */

/** One field value as a key part, or `undefined` when it has none. */
function partOf(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object")
    return "id" in value ? partOf((value as { id: unknown }).id) : JSON.stringify(value);
  return String(value as string | number | boolean | bigint);
}

/**
 * The key of `row` by `fields`, or `undefined` when one of them is missing or null.
 *
 * @example
 * rowKey({ scopeId: "scp_1", code: "A" }, ["scopeId", "code"]); // '["scp_1","A"]'
 */
export function rowKey(row: object, fields: readonly string[]): string | undefined {
  const parts: string[] = [];
  for (const field of fields) {
    const part = partOf((row as Record<string, unknown>)[field]);
    if (part === undefined) return undefined;
    parts.push(part);
  }
  return JSON.stringify(parts);
}

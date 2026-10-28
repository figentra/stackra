/**
 * Stackra file contract:
 * Purpose: `canonicalJson`, one JSON text per value: object keys sorted at every depth (by UTF-16 code unit), members
 *          whose value is `undefined` dropped, array order kept, dates as ISO 8601 UTC and `null` kept, so a value
 *          read back from jsonb (whose keys Postgres reorders) writes the same text it was written with. The text a
 *          hash chain, a signature or a content address is computed over.
 * Boundary: pure, no dependency. Byte for byte the form `@stackra/access-log` chains over, so that package can call
 *           this one without breaking a stored chain: an `undefined` array item and a non-finite number write `null`,
 *           integer-like keys sort as text (not in the engine's numeric order), `toJSON` is not consulted except on
 *           a `Date`. A change to this form breaks every chain built on it, so it never changes.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a hash chain); ADR 0416 (one canonical form for chains and signatures).
 */

/**
 * `value` as canonical JSON.
 *
 * @example
 * canonicalJson({ b: 1, a: [new Date(0), undefined] }); // '{"a":["1970-01-01T00:00:00.000Z",null],"b":1}'
 */
export function canonicalJson(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const fields = value as Record<string, unknown>;
    const keys = Object.keys(fields)
      .filter((key) => fields[key] !== undefined)
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(fields[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

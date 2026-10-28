/**
 * Stackra file contract:
 * Purpose: `correlationKey`, the canonical text of a correlation, so the value a waiting step computes and the value a
 *          signal is sent with compare equal however their keys were ordered.
 * Boundary: internal and pure. Text stays as it is; an object or array becomes JSON with every object's keys sorted;
 *           nothing becomes `""`.
 * Runtime: isomorphic
 * Governing contract: ADR 0152 (0294 note: a waiting step resumes on the signal whose correlation matches).
 */

/** `value` with every object's keys sorted, recursively. */
function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value === null || typeof value !== "object" || value instanceof Date) return value;
  const fields = value as Readonly<Record<string, unknown>>;
  return Object.fromEntries(
    Object.keys(fields)
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
      .map((key) => [key, sorted(fields[key])]),
  );
}

/**
 * The canonical form of `value`.
 *
 * @example
 * correlationKey({ reference: "ord_1", memberId: "mem_1" }); // '{"memberId":"mem_1","reference":"ord_1"}'
 * correlationKey("ord_1"); // "ord_1"
 * correlationKey(undefined); // ""
 */
export function correlationKey(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(sorted(value));
}

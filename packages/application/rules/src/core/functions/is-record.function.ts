/**
 * Stackra file contract:
 * Purpose: `isRecord(value, keys)`, whether a value from outside is a plain object whose own keys are all in `keys`.
 * Boundary: internal to the package (not exported from an entry); used to read condition nodes and operands, which
 *           are JSON a user wrote.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 10: a rule is data, checked before use).
 */

/** True when `value` is a non-null, non-array object with no key outside `keys`. */
export function isRecord(
  value: unknown,
  keys: readonly string[],
): value is Readonly<Record<string, unknown>> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => keys.includes(key))
  );
}

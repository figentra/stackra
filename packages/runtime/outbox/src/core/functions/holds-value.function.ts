/**
 * Stackra file contract:
 * Purpose: `holdsValue`, whether a JSON payload holds a string value at any depth: how the outbox drivers find the
 *          held messages that name an erased subject (stackra-275).
 * Boundary: pure; walks arrays and plain objects of a JSON value, compares strings exactly, never matches a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 2: erasure reaches every copy); data-layer gap gov6.
 */

/**
 * Whether `data` is `value` or holds it in an array item or an object field, at any depth.
 *
 * @example
 * holdsValue({ order: { customerId: "usr_1" } }, "usr_1"); // true
 * holdsValue({ usr_1: true }, "usr_1"); // false: keys are not values
 */
export function holdsValue(data: unknown, value: string): boolean {
  if (data === value) return true;
  if (data === null || typeof data !== "object") return false;
  return Object.values(data).some((item: unknown) => holdsValue(item, value));
}

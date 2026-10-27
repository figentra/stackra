/**
 * Stackra file contract:
 * Purpose: `isRecord(value, keys?)`, whether a value from outside (parsed JSON, a rule a user wrote) is a plain object
 *          (not `null`, not an array), and, when `keys` is given, whether its own keys are all in `keys`.
 * Boundary: public and pure; a type guard, so callers read fields one by one without a cast.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0331 (decision 10: a rule is checked before use);
 *                     stackra-224 (one copy, was rules and licensing).
 */

/**
 * True when `value` is a non-null, non-array object with no own key outside `keys` (any key when `keys` is absent).
 *
 * @example
 * isRecord({ a: 1 }); // true
 * isRecord([1]); // false
 * isRecord({ a: 1, b: 2 }, ["a"]); // false
 */
export function isRecord(
  value: unknown,
  keys?: readonly string[],
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (keys === undefined || Object.keys(value).every((key) => keys.includes(key)))
  );
}

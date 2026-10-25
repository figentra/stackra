/**
 * Stackra file contract:
 * Purpose: `stripeParams`, Stripe's bracket notation of a nested object (`metadata[reference]`,
 *          `line_items[0][quantity]`), dropping undefined and null fields.
 * Boundary: internal to the Stripe driver. Values stay strings, numbers or booleans; a caller turns a date into Unix
 *           seconds first.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2).
 */

/** A flat Stripe parameter set. */
export type StripeParams = Record<string, string | number | boolean>;

/**
 * Flattens `value` under `prefix`.
 *
 * @example
 * stripeParams({ metadata: { reference: "ord_1" } }); // { "metadata[reference]": "ord_1" }
 */
export function stripeParams(value: object, prefix = ""): StripeParams {
  const flat: StripeParams = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null) continue;
    const name = prefix === "" ? key : `${prefix}[${key}]`;
    if (typeof entry === "object") Object.assign(flat, stripeParams(entry as object, name));
    else flat[name] = entry as string | number | boolean;
  }
  return flat;
}

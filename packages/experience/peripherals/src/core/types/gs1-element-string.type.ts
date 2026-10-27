/**
 * Stackra file contract:
 * Purpose: `Gs1ElementString`, a GS1-128 or GS1 DataBar code read into its application identifiers: every element as
 *          encoded, and the GTIN, net weight and price a till acts on, each as an exact decimal string.
 * Boundary: a type only. `weight.value` and `price.value` are decimal strings, so a weight conversion or
 *           `Money.of(value, currency)` keeps every digit. A price under 392n carries no currency (the till's own);
 *           under 393n the currency is the ISO 4217 numeric code the label printed (`"978"`).
 * Runtime: isomorphic
 * Governing contract: the GS1 General Specifications (application identifiers); ADR 0339 (decision 7); STA-965.
 */

/** A GS1 element string, read. */
export interface Gs1ElementString {
  /** The scanned code, as read. */
  readonly code: string;

  /** Each application identifier and its value as encoded (`{ "01": "09501101530003", "3103": "001250" }`). */
  readonly elements: Readonly<Record<string, string>>;

  /** The GTIN (AI 01), or null when the code has none. */
  readonly gtin: string | null;

  /** The net weight (AI 310n in kilograms, 320n in pounds), or null. */
  readonly weight: { readonly value: string; readonly unit: "kg" | "lb" } | null;

  /** The amount payable (AI 392n, or 393n with its ISO 4217 numeric currency), or null. */
  readonly price: { readonly value: string; readonly currency: string | null } | null;
}

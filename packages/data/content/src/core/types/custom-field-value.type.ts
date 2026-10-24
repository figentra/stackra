/**
 * Stackra file contract:
 * Purpose: `CustomFieldValue`, the value one custom field holds on a record, as `checkCustomFields` returns it and the
 *          side table stores it.
 * Boundary: a type only; plain JSON. `text`, `long_text`, `date` (`YYYY-MM-DD`), `select`, `url` and `email` hold a
 *           string, `number` a finite number, `boolean` a boolean and `multi_select` distinct choice values.
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT2); ADR 0226 (decision 1).
 */

/**
 * One stored value.
 *
 * @example
 * const values: Readonly<Record<string, CustomFieldValue>> = { shoeSize: "42", giftWrap: true };
 */
export type CustomFieldValue = string | number | boolean | readonly string[];

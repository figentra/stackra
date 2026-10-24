/**
 * Stackra file contract:
 * Purpose: `JsonLd`, one structured-data block a route's `meta()` returns (`{ "@type": "Product", ... }`), before the
 *          escaper serialises it.
 * Boundary: a type only. Values are whatever JSON can carry; an `undefined` value is dropped by serialisation, so a
 *           block may spread optional fields freely. `@context` is added when the block leaves it out.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 4).
 */

/** One schema.org block. */
export type JsonLd = { readonly [key: string]: unknown };

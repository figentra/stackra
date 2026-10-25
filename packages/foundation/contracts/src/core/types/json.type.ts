/**
 * Stackra file contract:
 * Purpose: `Json`: any value that survives `JSON.stringify` and `JSON.parse` unchanged, for open documents such as a
 *          rich-text body or an extension's payload.
 * Boundary: a type only. `undefined`, functions, `Date`, `bigint` and class instances are not JSON; a `Date` field is
 *           a `Date` with its own codec, never `Json`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the shape compiler maps platform types), ADR 0154 (tenant data carries no
 *                     code).
 */

/** A JSON value: a primitive, `null`, an array of JSON values or an object of JSON values. */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/**
 * Stackra file contract:
 * Purpose: `TableRow`, one row of a resource table as the collection engine holds it: the list query's item with its
 *          public id (or its place) as `id`.
 * Boundary: a type only; the web and native resource tables share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: wire paths); ADR 0505.
 */

/** One table row. */
export type TableRow = Readonly<Record<string, unknown>> & { readonly id: string };

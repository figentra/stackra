/**
 * Stackra file contract:
 * Purpose: the shape of one entry in the site's `/index.json` schema list.
 * Boundary: a type only; the JSON keys are a public contract for tools that discover schemas.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 2).
 */

/** One latest schema, as `/index.json` lists it. */
export interface SchemaIndexEntry {
  /** The schema's canonical URL, equal to its `$id` (for example `https://static.stackra.figentra.com/mcp.json`). */
  id: string;
  /** The schema's `title`, or its path when it has none. */
  title: string;
}

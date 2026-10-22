/**
 * Stackra file contract:
 * Purpose: the shape of a schema after parse-schema.ts has validated it and derived its URL path from `$id`.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 2).
 */

/** A validated schema document, ready to be published at one or more paths. */
export interface ParsedSchema {
  /**
   * The `$id` path below `/schemas`, starting with `/` (for example `/runway/app.json` for `$id`
   * `https://static.stackra.figentra.com/schemas/runway/app.json`); plan-site.ts nests it under each alias tree.
   */
  name: string;
  /** The schema's `title`, or its `$id` path when it has none; listed in `/schemas/index.json`. */
  title: string;
  /** The parsed JSON document; plan-site.ts rewrites its `$id` for every copy it publishes. */
  document: Record<string, unknown>;
}

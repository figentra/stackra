/**
 * Stackra file contract:
 * Purpose: the shape of one JSON Schema file as read from the working tree or from a release tag.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files).
 */

/** One `*.schema.json` file, unparsed, as the readers return it and plan-site.ts consumes it. */
export interface SchemaSource {
  /** Repository-relative path, for error messages only (for example `tools/schemas/runway-app.schema.json`). */
  file: string;
  /** The file's full text; plan-site.ts parses it and reads `$id` and `title`. */
  text: string;
}

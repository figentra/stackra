/**
 * Stackra file contract:
 * Purpose: the shape of one file of the built site, as plan-site.ts plans it and write-site.ts writes it.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files).
 */

/** One file the Worker will serve (or, for `/_headers`, read as configuration). */
export interface SiteFile {
  /** URL path, starting with `/` (for example `/1.4.0/runway/app.json`); also the path under the assets folder. */
  path: string;
  /** The file's full contents, UTF-8. */
  body: string;
}

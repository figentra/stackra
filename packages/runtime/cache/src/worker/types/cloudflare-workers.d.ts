/**
 * Stackra file contract:
 * Purpose: the type of the Workers runtime module `cloudflare:workers` as this package reads it: `env`, the Worker's
 *          bindings, importable outside a request handler.
 * Boundary: an ambient declaration for the `./worker` entry only, read by this package's own typecheck; a Worker
 *           member's `wrangler types` declarations stay the source of the full type there.
 * Runtime: worker
 * Governing contract: ADR 0284 (Workers members); ADR 0127 2026-10-24 note (`./worker` entry).
 */
declare module "cloudflare:workers" {
  /** The Worker's bindings by name. */
  export const env: object;
}

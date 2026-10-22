/**
 * Stackra file contract:
 * Purpose: the public hostname of Stackra's hosted static files, the one host every schema `$id` must name.
 * Boundary: a constant only; wrangler.jsonc carries the same hostname as the Worker's custom domain.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files), ADR 0175 (domain names).
 */

/**
 * Hostname of the static-files Worker. Each kind of file has its own first path segment under it (`/schemas/…`). A
 * schema whose `$id` names another host is a build error, because the published URL would not match the identifier
 * editors resolve. Keep in step with `routes` in wrangler.jsonc.
 */
export const STATIC_HOST = "static.stackra.figentra.com";

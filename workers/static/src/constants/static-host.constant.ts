/**
 * Stackra file contract:
 * Purpose: the main public hostname of the shared static-files Worker, `static.figentra.com` (ADR 0284 amendment,
 *          STA-2892): what a new schema's `$id` names and what `/schemas/index.json` reports as `host`.
 * Boundary: a constant only; runway.yaml lists it first in the member's `customDomains`.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decisions 2 and 3 as amended), ADR 0175 (domain names).
 */

/**
 * Main hostname of the static-files Worker. Each kind of file has its own first path segment under it (`/schemas/…`).
 * The Worker also answers on every host of `STATIC_HOSTS`. Keep in step with `customDomains` in runway.yaml.
 */
export const STATIC_HOST = "static.figentra.com";

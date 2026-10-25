/**
 * Stackra file contract:
 * Purpose: `RUNWAY_SCHEMA_ORIGIN`, the hosted home of the runway JSON Schemas (the static Worker), used as each
 *          schema's `$id` and named by the `yaml-language-server` line of every runway file.
 * Boundary: a URL prefix only; the same files ship in the package as `@stackra/runway/schema/<kind>.json`.
 * Runtime: isomorphic
 * Governing contract: ADR 0284 (the static Worker), ADR 0296.
 */

/** `<origin>/<kind>.json` is a runway schema's `$id`. */
export const RUNWAY_SCHEMA_ORIGIN = "https://static.stackra.figentra.com/schemas/runway";

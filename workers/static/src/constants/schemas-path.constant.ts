/**
 * Stackra file contract:
 * Purpose: the URL path prefix of the JSON Schemas on the static host, `/schemas`.
 * Boundary: a constant only; every schema `$id` path starts with it and every schema alias tree sits under it.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 2).
 */

/**
 * Path prefix of the schemas kind, without a trailing slash. Versions nest below it (`/schemas/1.4.0/runway/app.json`),
 * so each kind of hosted file keeps its own version trees and `_headers` rules.
 */
export const SCHEMAS_PATH = "/schemas";

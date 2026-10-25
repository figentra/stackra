/**
 * Stackra file contract:
 * Purpose: `ROOT_SOURCE`, the source a `RunwayInvalidError` raised by infra-gcp names: the root runway, as the GCP
 *          foundation reads it.
 * Boundary: internal; a description, not a file path, since the root reaches infra-gcp already parsed.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement).
 */

/** The source infra-gcp's runway failures name. */
export const ROOT_SOURCE = "root runway (GCP foundation)";

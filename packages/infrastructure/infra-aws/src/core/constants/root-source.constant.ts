/**
 * Stackra file contract:
 * Purpose: `ROOT_SOURCE`, the source a `RunwayInvalidError` raised by infra-aws names: the root runway, as the AWS
 *          foundation reads it.
 * Boundary: internal; a description, not a file path, since the root reaches infra-aws already parsed.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement).
 */

/** The source infra-aws's runway failures name. */
export const ROOT_SOURCE = "root runway (AWS foundation)";

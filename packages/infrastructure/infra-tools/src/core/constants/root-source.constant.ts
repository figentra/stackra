/**
 * Stackra file contract:
 * Purpose: `ROOT_SOURCE`, the source a `RunwayInvalidError` raised by infra-tools names: the root runway, as the
 *          tools stack reads it.
 * Boundary: internal; a description, not a file path, since the root reaches infra-tools already parsed.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement).
 */

/** The source infra-tools' runway failures name. */
export const ROOT_SOURCE = "root runway (tools stack)";

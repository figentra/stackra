/**
 * Stackra file contract:
 * Purpose: `MIN_NODE_MAJOR`, the oldest Node.js major line `create-stackra` starts on: the `engines` of every Stackra
 *          package, `@stackra/cli` included.
 * Boundary: constant only.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */

/** The oldest Node.js major line `@stackra/cli` supports. */
export const MIN_NODE_MAJOR = 24;

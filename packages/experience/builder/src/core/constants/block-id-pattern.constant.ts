/**
 * Stackra file contract:
 * Purpose: `BLOCK_ID_PATTERN`, what a block instance's id may be: 1 to 64 of `A-Z`, `a-z`, `0-9`, `_` and `-`.
 * Boundary: a constant; `parseDocumentNode` refuses another id (`id_invalid`) and the shared-document reader skips a
 *           block that has one. A UUID fits; a `.` never does, so an id is always the first segment of a
 *           `problems` path (`<id>.<prop path>`).
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 1 and 4); ADR 0140 (field errors by path).
 */

/** A block id. */
export const BLOCK_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Stackra file contract:
 * Purpose: `DEV_LOG_MAX_BYTES`, the size the dev log may reach before it rotates: 5 MiB. With the one rotated file
 *          kept beside it, the dev log never holds more than twice this on disk.
 * Boundary: a number only; `appendDevLog` applies it.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1); STA-2889.
 */

/** The dev log's size limit in bytes, before it rotates. */
export const DEV_LOG_MAX_BYTES = 5 * 1024 * 1024;

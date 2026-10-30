/**
 * Stackra file contract:
 * Purpose: `COPIED_RESET_MS`, how long a CopyButton shows its check before it turns back into the copy icon.
 * Boundary: data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same timing on web and native); design-system gap inventory row 35.
 */

/** The check shows for two seconds, long enough to see and short enough to copy again. */
export const COPIED_RESET_MS = 2000;

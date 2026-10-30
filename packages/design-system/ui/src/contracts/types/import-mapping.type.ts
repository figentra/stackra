/**
 * Stackra file contract:
 * Purpose: `ImportMapping`, which field each column of an import file fills: the field key, or null to skip it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */

/** Column name to field key, or null for a skipped column. */
export type ImportMapping = Readonly<Record<string, string | null>>;

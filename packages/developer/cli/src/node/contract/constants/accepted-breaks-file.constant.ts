/**
 * Stackra file contract:
 * Purpose: `ACCEPTED_BREAKS_FILE`, where `stackra contract` reads the HTTP contract breaks a workspace accepts on
 *          purpose, relative to the workspace root.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: `oasdiff` contract checks); STA-2837.
 */

/** The accepted-breaks file, from the workspace root. A workspace without one accepts no break. */
export const ACCEPTED_BREAKS_FILE = "tools/contract/accepted-breaks.yaml";

/**
 * Stackra file contract:
 * Purpose: `ENCORE_STAGE`, the folder `stackra encore:stage` writes a multi-service product's Encore app root to,
 *          relative to the repository root.
 * Boundary: a constant only. Under `.stackra/`, so it is gitignored with the rest of the generated output.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09: multi-service apps, option b).
 */

/** The staging folder, relative to the repository root. */
export const ENCORE_STAGE = ".stackra/encore-app";

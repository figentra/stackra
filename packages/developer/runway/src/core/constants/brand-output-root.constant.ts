/**
 * Stackra file contract:
 * Purpose: `BRAND_OUTPUT_ROOT`, where Runway's brand step writes the generated brand set, relative to the product
 *          repository's root.
 * Boundary: internal; `brandGenerateRequest` reads it. The folder is under the gitignored `.stackra/`, so the
 *           generated set is never committed (owner decision of 2026-10-26).
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5), ADR 0295 (`.stackra/` holds generated output).
 */

/** `.stackra/brand`. */
export const BRAND_OUTPUT_ROOT = ".stackra/brand";

/**
 * Stackra file contract:
 * Purpose: `ENCORE_WIRING_CONFIG`, the Vitest config of a service's Encore wiring tier, relative to the member root: it runs
 *          only the generated wiring suite, and `stackra test --tier wiring` hands it to `encore test`.
 * Boundary: a constant string; the file is gitignored and owned by gen, like the rest of `.stackra/`.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 3: a thin Encore test suite covers the wiring); ADR 0295 (decision 5: tool
 *                     configs in `.stackra/`); STA-2838.
 */

/** The Vitest config that runs only the wiring suite, under `encore test`. */
export const ENCORE_WIRING_CONFIG = ".stackra/vitest.wiring.config.ts";

/**
 * Stackra file contract:
 * Purpose: `ENCORE_WIRING_TEST`, the generated Encore wiring suite of a service, relative to the member root: the file
 *          `emitEncoreWiringTest` writes and the wiring-tier config (`ENCORE_WIRING_CONFIG`) runs.
 * Boundary: a constant string; the file is gitignored and owned by gen, like the rest of `.stackra/`.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 3: a thin Encore test suite covers the wiring); ADR 0295 (decision 5: tool
 *                     configs in `.stackra/`); STA-2838.
 */

/** The generated Encore wiring suite of a service. */
export const ENCORE_WIRING_TEST = ".stackra/tests/encore-wiring.test.ts";

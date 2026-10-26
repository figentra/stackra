/**
 * Stackra file contract:
 * Purpose: `ROOT_VITEST_SHIM`, the path of the root `vitest.config.ts` shim gen writes beside `.stackra/` so
 *          `vitest run` from the member root loads the generated config and its setup.
 * Boundary: one spelling, read by the tool-config emitter and by `generate`, which refuses to replace an authored file
 *           at this path.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 5: a tool that reads only the member root gets a gitignored shim); STA-1296.
 */

/** The member-root path of the Vitest shim. */
export const ROOT_VITEST_SHIM = "vitest.config.ts";

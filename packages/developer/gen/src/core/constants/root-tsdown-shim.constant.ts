/**
 * Stackra file contract:
 * Purpose: `ROOT_TSDOWN_SHIM`, the path of the root `tsdown.config.ts` shim gen writes beside `.stackra/` so `tsdown`
 *          runs from the member root (its cwd), where the generated config's `.stackra/entry` paths resolve.
 * Boundary: one spelling, read by the tool-config emitter and by `generate`, which refuses to replace an authored file
 *           at this path.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 5: a tool that reads only the member root gets a gitignored shim); STA-1296.
 */

/** The member-root path of the tsdown shim. */
export const ROOT_TSDOWN_SHIM = "tsdown.config.ts";

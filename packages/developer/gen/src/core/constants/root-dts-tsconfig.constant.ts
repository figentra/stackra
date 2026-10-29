/**
 * Stackra file contract:
 * Purpose: `ROOT_DTS_TSCONFIG`, the path of the root `tsconfig.build.json` gen writes beside the tsdown shim: the
 *          member's tsconfig plus `.stackra/entry`, for tsdown's declaration step.
 * Boundary: one spelling, read by the tool-config emitter and by `generate`, which writes it only with the tsdown shim
 *           (an authored root tsdown config sets its own `dts`) and refuses to replace an authored file at this path.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 5: a tool that reads only the member root gets a gitignored shim); STA-1296.
 */

/** The member-root path of the declaration build's tsconfig. */
export const ROOT_DTS_TSCONFIG = "tsconfig.build.json";

/**
 * Stackra file contract:
 * Purpose: `WIRING_RAN_MARKER`, the file the `stackra test` that `encore test` starts writes, in the member root, just
 *          before it runs the generated wiring suite. `stackra test --tier wiring` removes it before starting
 *          `encore test` and, when Encore exits 0, refuses the run unless the file is back: an `encore test` that
 *          passed without the wiring suite (the tier never reached the inner run) is a failure, never a silent pass.
 * Boundary: a constant path under `.stackra/`, which gen owns and git ignores; the file's content is only a timestamp.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 3: the thin Encore test suite for the wiring); STA-2838.
 */

/** The marker of a wiring suite that started under `encore test`, relative to the member root. */
export const WIRING_RAN_MARKER = ".stackra/encore-wiring.ran";

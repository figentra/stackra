/**
 * Stackra file contract:
 * Purpose: `TestMarker`, one call in a test file that keeps a test or suite from always running (`it.skip`,
 *          `describe.skipIf(…)`, `test.todo`, `xit`, `it.only`, …), as `testMarkers` finds it.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4); STA-2842.
 */

/** A test marker and where it is. */
export type TestMarker = {
  /** The test file, repository-relative with forward slashes. */
  readonly file: string;

  /** The 1-based line of the marker. */
  readonly line: number;

  /**
   * The marker: `skip`, `todo`, `fixme`, `fails` or `only` as written (an `x`-prefixed call is `skip`), or `skipIf` /
   * `runIf` for an environment gate.
   */
  readonly kind: "skip" | "todo" | "fixme" | "fails" | "only" | "skipIf" | "runIf";

  /** The first argument of the test or suite call: a string literal's value, else its source text; empty when none. */
  readonly title: string;
};

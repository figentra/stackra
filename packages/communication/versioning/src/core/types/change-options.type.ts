/**
 * Stackra file contract:
 * Purpose: `ChangeOptions`, what `Change<Subject>({ from, sunset })` takes: where the old shape starts and the day it
 *          stops being served.
 * Boundary: a type only. The type of `from` says the change's form: a whole number is an event change (the version
 *          whose fields the class holds), a calendar date is a dated response change (the day the subject's newer
 *          shape shipped). `Change` checks both values and records them in the kind registry; gen locks them in
 *          `stackra.manifest.json`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 5); ADR 0118 (2026-10-23 note); ADR 0141 (2026-10-23 note).
 */

/** The options of a change; `F` is `number` for an event change and `string` for a dated one. */
export interface ChangeOptions<F extends number | string = number | string> {
  /**
   * An event change: the version whose fields this class holds (`1` beside an event at `version: 2`). A dated change:
   * the `YYYY-MM-DD` day the subject's newer shape shipped; callers pinned before it get this class's shape.
   */
  readonly from: F;

  /** The `YYYY-MM-DD` day the old shape stops being served; after it, gen fails while the change file exists. */
  readonly sunset: string;
}

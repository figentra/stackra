/**
 * Stackra file contract:
 * Purpose: `WorkflowDispatches`, the `gh` argument lists a deploy or promote runs, and the caller workflows a promote
 *          skips because they take no `sha` input.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0170; STA-268.
 */

/** The dispatches of a deploy or promote. */
export interface WorkflowDispatches {
  /** The `gh` argument lists, one per dispatched caller workflow. */
  readonly runs: readonly (readonly string[])[];
  /** The caller workflows a promote skips, because they take no `sha` input. */
  readonly skipped: readonly { readonly target: string; readonly file: string }[];
}

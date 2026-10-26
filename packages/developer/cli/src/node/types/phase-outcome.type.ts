/**
 * Stackra file contract:
 * Purpose: `PhaseOutcome`, what one phase of `stackra check` returns: its findings, or why it did not run (its tool is
 *          not installed in this repository).
 * Boundary: type only. `runCheck` derives the status: skipped when `skipped` is set, failed when any finding is an
 *           error, passed otherwise.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */
import type { Finding } from "@stackra/repo-checks/node";

/** The result of one phase. */
export type PhaseOutcome = {
  /** Every problem the phase found. */
  readonly findings: readonly Finding[];

  /** Why the phase did not run (`not installed`), or `undefined` when it ran. */
  readonly skipped?: string | undefined;
};

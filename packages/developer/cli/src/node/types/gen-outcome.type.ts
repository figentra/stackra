/**
 * Stackra file contract:
 * Purpose: `GenOutcome`, one gen run over one member as data: the member folder (relative to the run's base), whether
 *          it came out clean, its refusals and warnings as gen reported them (each `file` relative to the member), and
 *          the files it wrote, or with `check` the files that are stale. `stackra gen --json` reports these.
 * Boundary: type only; `runGen` hands one to its `onOutcome` after it prints the same run.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26: refusals carry their fix); ADR 0506; STA-2883.
 */
import type { GenError } from "@stackra/gen";

/** One member's gen run. */
export type GenOutcome = {
  /** The member folder relative to the run's base, `.` for the base itself. */
  readonly member: string;

  /** No refusal, and with `check` nothing stale. */
  readonly clean: boolean;

  /** The refusals gen reported. */
  readonly errors: readonly GenError[];

  /** The warnings (never a failure). */
  readonly warnings: readonly GenError[];

  /** The files written, relative to the member. */
  readonly written: readonly string[];

  /** With `check`: the files that are out of date, relative to the member. */
  readonly stale: readonly string[];
};

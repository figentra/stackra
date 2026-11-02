/**
 * Stackra file contract:
 * Purpose: `CheckRow`, one row of a checklist (a doctor check, a gate): its name, status, detail, the command that
 *          fixes it and its group, plus any fields the command adds, which `--json` keeps unchanged.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-009 and FR-030.
 */
import type { CheckStatus } from "#contracts/types/check-status.type";

/** A checklist row. */
export interface CheckRow {
  /** What was checked. */
  readonly name: string;

  /** How it went. */
  readonly status: CheckStatus;

  /** What was found. */
  readonly detail?: string;

  /** The exact command that fixes it. */
  readonly fix?: string;

  /** The heading it sits under (`Machine`, `Repo`). */
  readonly group?: string;

  /** Fields of the command's own (doctor's `run` argv), kept for `--json`. */
  readonly [extra: string]: unknown;
}

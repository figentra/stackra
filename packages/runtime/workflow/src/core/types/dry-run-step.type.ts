/**
 * Stackra file contract:
 * Purpose: `DryRunStep`, one step of a dry run: its name and block, what it would do, the input it would send (later
 *          steps' results left as references), what it would wait for, how many items a for-each step would
 *          take, and its condition's explained evaluation.
 * Boundary: a type only. The input may hold the sample input's values; it is shown to the author, never logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0331 (decision 7: explanation by path).
 */
import type { Evaluation } from "@stackra/rules";

import type { DryRunOutcome } from "#core/enums/dry-run-outcome.enum";

/** One dry-run step. */
export interface DryRunStep {
  /** The step's name. */
  readonly name: string;

  /** The action block it calls; absent for a wait-only step. */
  readonly block?: string;

  /** What it would do. */
  readonly outcome: DryRunOutcome;

  /** The input it would send; a for-each step's for its first item. */
  readonly input: unknown;

  /** How many items a for-each step would call its block for (0 while its list is not known yet). */
  readonly iterations?: number;

  /** The trigger block it would wait for, the reference that correlates it, and the correlation when known. */
  readonly waitsFor?: {
    readonly block: string;
    readonly correlate: string;
    readonly correlation?: string;
  };

  /** Its condition's evaluation, when it has one. */
  readonly evaluation?: Evaluation;
}

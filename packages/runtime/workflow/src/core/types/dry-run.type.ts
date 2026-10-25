/**
 * Stackra file contract:
 * Purpose: `DryRun`, what `dryRun` reports for an automation document and a sample input: the document's key and
 *          version, and each step's dry-run step.
 * Boundary: a type only. A dry run calls no action, holds no signal and writes nothing; `AutomationService.dryRun`
 *           records that one was made for a revision, which publishing requires.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0270 (decision 6); ADR 0152 (decision 6: test runs).
 */
import type { DryRunStep } from "#core/types/dry-run-step.type";

/** One dry run. */
export interface DryRun {
  /** The document's key. */
  readonly key: string;

  /** The document's version. */
  readonly version: number;

  /** Each step, in document order. */
  readonly steps: readonly DryRunStep[];
}

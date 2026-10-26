/**
 * Stackra file contract:
 * Purpose: `CheckPhase`, one phase of `stackra check`: its name (what `--only` and `--skip` take), the tool it runs,
 *          the ADR that governs it, and its `run`.
 * Boundary: type only; the phases are the `*-phase.constant.ts` values, in `CHECK_PHASES` order.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */
import type { CheckRun } from "#node/types/check-run.type";
import type { PhaseOutcome } from "#node/types/phase-outcome.type";

/** One `stackra check` phase. */
export type CheckPhase = {
  /** The phase name: `config`, `format`, `spelling`, … */
  readonly name: string;

  /** The tool or check family that does the work (`oxfmt`, `repo-checks`, …). */
  readonly tool: string;

  /** The ADR a finding of this phase falls under when the tool names none, or `null`. */
  readonly adr: string | null;

  /** Runs the phase and resolves with its findings; it never prints a finding itself. */
  readonly run: (run: CheckRun) => Promise<PhaseOutcome>;
};

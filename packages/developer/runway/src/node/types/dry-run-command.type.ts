/**
 * Stackra file contract:
 * Purpose: `DryRunCommand`, a `CommandRunner` that runs nothing: it records every command with its folder and
 *          answers with a stand-in output, so a job prints its plan and writes its local outputs without reaching
 *          git, npm, EAS or wrangler.
 * Boundary: type only; `dryRunCommand` builds it.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3: the same commands in CI and a terminal); ADR 0481.
 */
import type { DeployStep } from "#core/types/deploy-step.type";
import type { CommandRunner } from "#node/types/command-runner.type";

/** A recording runner. */
export type DryRunCommand = CommandRunner & {
  /** Every command it was asked to run, in order. */
  readonly calls: readonly DeployStep[];
};

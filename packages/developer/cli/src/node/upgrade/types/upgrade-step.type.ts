/**
 * Stackra file contract:
 * Purpose: `UpgradeStep`, a command a codemod needs run after the new versions are installed, such as
 *          `stackra encore:prepare` in every service: what to run and where.
 * Boundary: type only; `upgradeStepRuns` turns steps into the runs of one workspace.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */

/** A command run after the install. */
export type UpgradeStep = {
  /** The command and its arguments, run with `pnpm exec` (for example `["stackra", "encore:prepare"]`). */
  readonly command: readonly string[];

  /** Where it runs: the workspace root, or each service member (`services/*`). */
  readonly in: "root" | "services";
};

/**
 * Stackra file contract:
 * Purpose: `UpgradeStepRun`, one command `stackra upgrade` runs (or prints, under `--no-install`) after it wrote the
 *          edits: the program, its arguments, its folder and why it runs.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */

/** A command to run. */
export type UpgradeStepRun = {
  /** The program and its arguments, such as `["pnpm", "install"]`. */
  readonly command: readonly string[];

  /** The folder, relative to the workspace root (`.` for the root). */
  readonly cwd: string;

  /** Why: `install`, `gen`, or the codemod ids that asked for it. */
  readonly why: readonly string[];
};

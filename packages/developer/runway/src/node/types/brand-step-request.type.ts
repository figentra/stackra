/**
 * Stackra file contract:
 * Purpose: `BrandStepRequest`, one run of Runway's brand step: the repository, whether to check or write, the parent
 *          kit folder, and, for a scope-started white-label build, the scope's theme as a kit folder.
 * Boundary: type only; `runBrandStep` takes it. Without `variant` the step builds every web surface and mobile app of
 *           the root runway; with it, only that app's icons and splash for that scope. The scope's kit folder is
 *           written by the job that received the OS event, from the scope's theme; the step only reads it.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D17); ADR 0439 (decision 8: white-label from data in the OS); app-shells
 *                     section 14; ADR 0323 and R-59 (scope).
 */
import type { CommandRunner } from "#node/types/command-runner.type";

/** One brand step run. */
export type BrandStepRequest = {
  /** The product repository's root folder, holding the root `runway.yaml` and `assets/brand`. */
  readonly repository: string;
  /** Check only (`--check`): write nothing, fail on a missing kit file, a non-deterministic or stale output. */
  readonly check?: boolean;
  /** A parent kit's folder, relative to `repository` or absolute (the kit's `--parent-kit-dir`), read as data. */
  readonly parentKitDir?: string;
  /** A white-label build: the app under the root runway's `mobile`, the scope id and the scope's kit folder. */
  readonly variant?: {
    readonly app: string;
    readonly scope: string;
    /** Relative to `repository`, holding the scope's `kit.json` and theme. */
    readonly kitDir: string;
  };
  /** The kit's binary; `BRAND_STEP_SETTINGS.command` when absent. */
  readonly command?: string;
  /** The command runner; `runCommand` when absent. */
  readonly run?: CommandRunner;
};

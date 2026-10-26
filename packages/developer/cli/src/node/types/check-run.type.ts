/**
 * Stackra file contract:
 * Purpose: `CheckRun`, what one phase of `stackra check` receives: the repository root, whether to fix, the affected
 *          files (undefined for the whole repository), the base ref, whether it runs in CI, and where notices go.
 * Boundary: type only; `runCheck` builds one per run.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */
import type { CliIo } from "#node/types/cli-io.type";

/** The input of one check phase. */
export type CheckRun = {
  /** The absolute workspace root. */
  readonly root: string;

  /** Apply fixes before checking. */
  readonly fix: boolean;

  /** The repository-relative files changed since the base, or `undefined` to check everything. */
  readonly files: readonly string[] | undefined;

  /** The base ref given with `--base`, or `undefined`. */
  readonly base: string | undefined;

  /** True when `CI` is set: an unbuilt dependency is a finding instead of a notice. */
  readonly ci: boolean;

  /** Where a phase writes a notice; findings are returned, never printed. */
  readonly io: CliIo;
};

/**
 * Stackra file contract:
 * Purpose: `CheckRunner`, the instance side of a check command `checkCommand` makes: the check flags as fields and a
 *          `handle` that resolves with the exit code, so a subclass (`ValidateCommand`) may call `super.handle`.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import type { Command, CommandIo } from "@stackra/console";

/** A check command instance. */
export type CheckRunner = Command & {
  /** `--fix`. */
  fix: boolean;

  /** `--affected`. */
  affected: boolean;

  /** `--only <phase,…>`. */
  only?: string | undefined;

  /** `--skip <phase,…>`. */
  skip?: string | undefined;

  /** `--format text|json|github`. */
  format: string;

  /** `--base <ref>`. */
  base?: string | undefined;

  /** `--with-tests`. */
  withTests: boolean;

  /** `--keep-going`. */
  keepGoing: boolean;

  /** Runs the phases and resolves with the exit code. */
  handle: (io: CommandIo) => Promise<number>;
};

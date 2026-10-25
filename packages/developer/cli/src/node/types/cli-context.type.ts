/**
 * Stackra file contract:
 * Purpose: `CliContext`, what a command's `run` receives: the working directory, the io, its parsed options and
 *          positionals, the arguments after `--`, and the CLI itself, so a command can run another in-process.
 * Boundary: type only; `runCli` builds it after parsing.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: `stackra` runs every operation; decision 5: the MCP runs its commands).
 */
import type { CliIo } from "#node/types/cli-io.type";

/** The input of one command run. */
export type CliContext = {
  /** The directory the command acts on: a member root or the workspace root. */
  readonly cwd: string;

  /** Where the command writes. */
  readonly io: CliIo;

  /** The parsed options, by long name. */
  readonly values: Readonly<Record<string, string | boolean | undefined>>;

  /** The positional arguments after the command name. */
  readonly positionals: readonly string[];

  /** The arguments after `--`, passed on untouched. */
  readonly rest: readonly string[];

  /** Runs another `stackra` command (its arguments without the program name) and resolves with its exit code. */
  readonly cli: (args: readonly string[], io: CliIo) => Promise<number>;
};

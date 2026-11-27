/**
 * Stackra file contract:
 * Purpose: `CliCommand`, the body of a `stackra` command class: its name (one or two words, `gen`, `mcp sync`), its
 *          one-line summary, its synopsis (the hint of a usage error), the options it reads by long name, and what it
 *          runs. The class declares the fields, the console parses them, and `runBody` hands them to `run`.
 * Boundary: type only. A body is data plus one `run` function, never listed itself: `COMMANDS` holds the classes
 *           (ADR 0500 decision 7: no passthrough command is left). "Command" means a CLI command only (ADR 0294
 *           decision 23), and no other package declares one.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0294 (decision 23); ADR 0083 (the `stackra` binary); ADR 0506;
 *                     STA-2883.
 */
import type { ParseArgsOptionsConfig } from "node:util";

import type { CliContext } from "#node/types/cli-context.type";

/** One `stackra` command. */
export type CliCommand = {
  /** The words that name it after `stackra`, space-separated (`gen`, `mcp sync`). */
  readonly name: string;

  /** One line for `stackra --help`. */
  readonly summary: string;

  /** The synopsis printed by `stackra <name> --help` and after a usage error. */
  readonly usage: string;

  /** The options it accepts; `--help` is added to every command. */
  readonly options?: ParseArgsOptionsConfig;

  /** Whether it takes positional arguments after its name. */
  readonly positionals?: boolean;

  /** Runs it and resolves with the exit code. */
  readonly run: (context: CliContext) => Promise<number>;
};

/**
 * Stackra file contract:
 * Purpose: `CliCommand`, one `stackra` command: its name (one or two words, `gen`, `mcp sync`), its help text, its
 *          `stackra list` heading and whether the list hides it, the options `node:util` `parseArgs` checks, and what it runs. This is the command framework the old `console`
 *          package carried, folded into the CLI (ADR 0127 2026-10-24 note).
 * Boundary: type only. A command is data plus one `run` function; "Command" means a CLI command only (ADR 0294
 *           decision 23), and no other package declares one.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0294 (decision 23); ADR 0083 (the `stackra` binary); STA-2872
 *                     spec FR-001.
 */
import type { ParseArgsOptionsConfig } from "node:util";

import type { CliContext } from "#node/types/cli-context.type";
import type { CommandGroup } from "#node/types/command-group.type";

/** One `stackra` command. */
export type CliCommand = {
  /** The words that name it after `stackra`, space-separated (`gen`, `mcp sync`). */
  readonly name: string;

  /** One line for `stackra --help`. */
  readonly summary: string;

  /** The heading `stackra list` shows it under. */
  readonly group?: CommandGroup;

  /** Left out of `stackra list` (a script, hook or tool runs it); it still runs by name, and `list --all` shows it. */
  readonly hidden?: boolean;

  /** The synopsis printed by `stackra <name> --help` and after a usage error. */
  readonly usage: string;

  /** The options it accepts; `--help` is added to every command. */
  readonly options?: ParseArgsOptionsConfig;

  /** Whether it takes positional arguments after its name. */
  readonly positionals?: boolean;

  /** Runs it and resolves with the exit code. */
  readonly run: (context: CliContext) => Promise<number>;
};

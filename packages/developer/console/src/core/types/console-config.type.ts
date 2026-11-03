/**
 * Stackra file contract:
 * Purpose: `ConsoleConfig`, what `createConsole` takes: the binary name, version and theme, the command registry,
 *          optionally a container factory called only to dispatch a command, the `--json` shape, and whether an
 *          invocation must name a command.
 * Boundary: a type only. `commands` is an explicit list or gen's `#stackra/commands`; nothing is scanned.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-006, FR-008 and FR-013; ADR 0506 (amendment 2026-11-03).
 */
import type { ConsoleTheme } from "#contracts/types/console-theme.type";
import type { CommandClass } from "#core/types/command-class.type";
import type { ConsoleContainer } from "#core/types/console-container.type";

/** One console. */
export interface ConsoleConfig {
  /** The binary name, used in usage lines (`stackra`). */
  readonly name: string;

  /** The version `--version` prints. */
  readonly version: string;

  /** The look; `STACKRA_THEME` when absent. */
  readonly theme?: ConsoleTheme;

  /** The commands. */
  readonly commands: readonly CommandClass[];

  /** Creates the container a command is resolved from; without it a command is built with no arguments. */
  readonly container?: () => Promise<ConsoleContainer> | ConsoleContainer;

  /**
   * What `--json` writes; `"envelope"` (`{ ok, data | error }`) when absent. `"bare"` writes the command's data alone
   * as one line whatever the exit code, nothing on stdout on an error, and human output and the problem screen on
   * standard error. Only for a CLI whose JSON an ADR froze (testbed, ADR 0522 d5).
   */
  readonly json?: "envelope" | "bare";

  /** An invocation that names no command and asks no help is a usage error (exit 2); false when absent. */
  readonly requireCommand?: boolean;
}

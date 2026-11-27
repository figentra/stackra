/**
 * Stackra file contract:
 * Purpose: `ConsoleConfig`, what `createConsole` takes: the binary name, version and theme, the command registry,
 *          optionally a container factory called only to dispatch a command, the `--json` shape, whether an
 *          invocation must name a command, the order of the command list's headings and the commands this run leaves
 *          out of the list.
 * Boundary: a type only. `commands` is an explicit list or gen's `#stackra/commands`; nothing is scanned.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-006, FR-008 and FR-013; ADR 0506 (amendment 2026-11-03); STA-2872 spec FR-001
 *                     and FR-002.
 */
import type { CommandStructure } from "#contracts/types/command-structure.type";
import type { ConsoleTheme } from "#contracts/types/console-theme.type";
import type { CommandClass } from "#core/types/command-class.type";
import type { ConsoleContainer } from "#core/types/console-container.type";

/** The settings of one console: its name, version, look and commands. */
export interface ConsoleConfig {
  /** The binary name, used in usage lines (`stackra`). */
  readonly name: string;

  /** The version `--version` prints. */
  readonly version: string;

  /** The look; `STACKRA_THEME` when absent. */
  readonly theme?: ConsoleTheme;

  /** The command classes the console runs. */
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

  /**
   * The order of the command list's headings (a command's `group`, else its namespace). Commands under no heading come
   * first, then the headings named here in this order, then any other heading alphabetically; alphabetical when absent.
   */
  readonly groups?: readonly string[];

  /**
   * Whether this run leaves a command out of the command list and tab completion, as `hidden` does, for a command
   * that is visible in some places only (a repository check outside its repository). It still runs by name, and
   * `<bin> list --all` shows it. Nothing is left out when absent.
   */
  readonly unlisted?: (structure: CommandStructure) => boolean;
}

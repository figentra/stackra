/**
 * Stackra file contract:
 * Purpose: `ActionCommandOptions`, what `ActionCommand(Action, Input, options)` takes: the command name, its one-line
 *          description and its group.
 * Boundary: a type only; gen writes it from the action's `command` option.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-022.
 */

/** What a command built from an action is told. */
export interface ActionCommandOptions {
  /** The command name. */
  readonly name: string;

  /** One line for the command list; `Runs <name>` when absent. */
  readonly description?: string;

  /** The group the command is listed under. */
  readonly group?: string;
}

/**
 * Stackra file contract:
 * Purpose: `CommandOptions`, what `Command({ ... })` takes: the command's name, its one-line description, and whether
 *          the list hides it, plus the other names it answers to.
 * Boundary: a type only; inert, serialisable data that the kernel reads without constructing the command.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-001; ADR 0294 (decision 16).
 */

/** The options of the `Command` kind. */
export interface CommandOptions {
  /** `[a-z0-9-]+` segments joined by `:`, as `tenant:seed`; written once, the kernel's key for the command. */
  readonly name: string;

  /** One line, shown in the command list and at the top of the command's help. */
  readonly description: string;

  /** Left out of the command list; it still runs by name. */
  readonly hidden?: boolean;

  /** Other names that run the command, of the same form as `name`. */
  readonly aliases?: readonly string[];
}

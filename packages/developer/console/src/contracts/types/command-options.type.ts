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

  /** Each run is recorded through the `CommandAudit` port, and refused when none is bound (STA-1731 FR-015). */
  readonly audit?: boolean;

  /** The package's own bin command: gen never contributes it to a host (STA-1731 FR-004). */
  readonly bin?: boolean;

  /** The heading the command list shows it under; its namespace (`tenant` of `tenant:seed`) when absent. */
  readonly group?: string;

  /** A docs link, shown at the end of the command's help and of its error screen. */
  readonly docs?: string;

  /** Complete invocations shown in the command's help, as `acme greet Ada --times 2`. */
  readonly examples?: readonly string[];

  /**
   * A tool of the local developer MCP (ADR 0282 decision 5) with the same schema and handler as the command; the
   * read-only hint when `{ readOnly: true }`. Never a tenant MCP tool.
   */
  readonly tool?: boolean | { readonly readOnly: boolean };

  /**
   * Migration only (ADR 0500 decision 7, STA-1966): the command declares no fields, and `io.rest` holds every token
   * after its name, raw, for a ported `run(args)` that still parses its own flags. Routing, `--help` and errors stay the
   * kernel's. A CLI is not done while any of its commands is passthrough; its tests pin the remaining list with
   * `passthroughCommands`.
   */
  readonly passthrough?: boolean;
}

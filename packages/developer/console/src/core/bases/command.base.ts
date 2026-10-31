/**
 * Stackra file contract:
 * Purpose: `Command({ name, description, hidden?, aliases? })`, the kind base of a console command: its fields carry
 *          `@Argument` and `@Option`, its constructor takes its collaborators, and `handle(io)` runs it.
 * Boundary: called only. The options are checked here (name and aliases); the fields are checked by `readCommand`,
 *           once the class is defined. A command's constructor only stores its collaborators, so the kernel may build
 *           it with no arguments to read the field defaults.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-001 and FR-005; ADR 0294 (decisions 16 and 25); ADR 0506.
 */
import { createKind } from "@stackra/container";

import type { CommandOptions } from "#contracts/types/command-options.type";
import { COMMAND_NAME } from "#core/constants/command-name.constant";
import { ConsoleDeclarationError } from "#core/errors/console-declaration.error";
import type { CommandClass } from "#core/types/command-class.type";
import type { CommandIo } from "#core/types/command-io.type";

/** The instance side every command shares. */
abstract class CommandBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a command. */
  declare readonly "~kind": "command";

  /**
   * Runs the command with its fields filled. Returns a `CommandResult` (an exit code, nothing, or the `--json` data);
   * typed `unknown` here so a subclass may return `Promise<void>`, and the kernel checks what comes back.
   */
  abstract handle(io: CommandIo): unknown;
}

/** A command instance. */
export type Command = CommandBase;

/** Checks the options of a command and applies their defaults. */
function read(options: CommandOptions): Readonly<Required<CommandOptions>> {
  const label = `Command(${JSON.stringify(options.name)})`;
  for (const name of [options.name, ...(options.aliases ?? [])])
    if (typeof name !== "string" || !COMMAND_NAME.test(name))
      throw new ConsoleDeclarationError(
        label,
        `the name ${JSON.stringify(name)} must be [a-z0-9-] segments joined by ":"`,
      );
  if (typeof options.description !== "string" || options.description.trim() === "")
    throw new ConsoleDeclarationError(label, "the description must be one line of text");
  return Object.freeze({
    name: options.name,
    description: options.description,
    hidden: options.hidden ?? false,
    aliases: Object.freeze([...(options.aliases ?? [])]),
  });
}

/**
 * The command kind base.
 *
 * @example
 * export class SeedAccountCommand extends Command({ name: "account:seed", description: "Seed an account" }) {
 *   @Argument({ description: "The account's slug" })
 *   account!: string;
 *
 *   @Option({ short: "c" })
 *   @Int({ min: 1 })
 *   count = 10;
 *
 *   constructor(accounts: AccountService) {
 *     super();
 *     this.accounts = accounts;
 *   }
 *
 *   async handle(io: CommandIo) {
 *     const rows = await io.output.task("Seeding", () => this.accounts.seed(this.account, this.count));
 *     io.output.success(`Seeded ${rows} rows`);
 *   }
 * }
 */
export const Command = createKind("command", CommandBase, read) as (
  options: CommandOptions,
) => CommandClass;

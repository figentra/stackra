/**
 * Stackra file contract:
 * Purpose: `ConsoleCommand`, `stackra console <member> [command] [args...] [-- <flags>]`: runs the member's generated
 *          console entry with the rest of the line, so a service lists and runs its own commands and its hosted
 *          packages'. The body is `CONSOLE_COMMAND`, unchanged; the exit code is the member command's.
 * Boundary: loads the entry through Vite in the member's folder and runs no gen; flags of the member's command go after
 *           `--`, since this command's own flags are parsed strictly.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6); ADR 0295; ADR 0500 (decision 7); STA-1731 spec FR-009; STA-2883.
 */
import { Argument, Command, type CommandIo } from "@stackra/console";
import { List, Str } from "@stackra/validation";

import { CONSOLE_COMMAND } from "#node/constants/console-command.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Runs a member's console. */
export class ConsoleCommand extends Command({
  name: "console",
  description: CONSOLE_COMMAND.summary,
  group: "Develop",
  bin: true,
  examples: ["stackra console example", "stackra console example db:status -- --json"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = CONSOLE_COMMAND;

  /** The member whose console runs: its folder or package name, such as example */
  @Argument({
    description: "The member whose console runs: its folder or package name, such as example",
    optional: true,
  })
  @Str
  member?: string;

  /** The member's command and its arguments; its flags go after -- */
  @Argument({ description: "The member's command and its arguments; its flags go after --" })
  @List
  args: string[] = [];

  /** Runs the member's console; the exit code is its command's. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, CONSOLE_COMMAND, {
      values: {},
      positionals: [this.member, ...this.args].filter((word): word is string => word !== undefined),
    });
  }
}

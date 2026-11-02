/**
 * Stackra file contract:
 * Purpose: `consoleCommand(command, summary, usage)`, a `stackra` command run by a `@stackra/console` command class:
 *          the console parses the line, prompts through the one prompter and renders the output and errors, all
 *          written through the caller's `CliIo`, the command built with the CLI's cwd in its `cwd` field. A captured
 *          `CliIo` (the local MCP) counts as no terminal, so nothing prompts and every prompt takes its default.
 * Boundary: dispatch only; the class does the work.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0506 (console commands); STA-1730 (the one prompter); ADR 0515.
 */
import { createConsole, readCommand, type CommandClass } from "@stackra/console";
import { nodePorts } from "@stackra/console/node";

import { cliVersion } from "#node/functions/cli-version.function";
import type { CliCommand } from "#node/types/cli-command.type";

/**
 * The `stackra` command for a console command class.
 *
 * @param command - the console command class; its declared name is the `stackra` command name.
 * @param summary - one line for `stackra --help`.
 * @param usage - the synopsis for `stackra --help`.
 * @example
 * export const DOCTOR_COMMAND = consoleCommand(DoctorCommand, "Check the machine", "stackra doctor [--fix]");
 */
export function consoleCommand(command: CommandClass, summary: string, usage: string): CliCommand {
  const name = readCommand(command).name;
  return {
    name,
    summary,
    usage,
    passthrough: true,
    run: ({ cwd, io, positionals }) => {
      const ports = nodePorts();
      return createConsole({
        name: "stackra",
        version: cliVersion(),
        commands: [command],
        // shortcut: hands the CLI's cwd to a command with a `cwd` field until ConsolePorts carries one (STA-1966).
        container: () => ({
          get: (type) => Object.assign(Reflect.construct(type, []) as object, { cwd }) as never,
          close: async () => {},
        }),
      }).run([name, ...positionals], {
        ...ports,
        stdout: { write: io.out },
        stderr: { write: io.err },
        stdoutIsTTY: io.inherit && ports.stdoutIsTTY,
        stdinIsTTY: io.inherit && ports.stdinIsTTY,
      });
    },
  };
}

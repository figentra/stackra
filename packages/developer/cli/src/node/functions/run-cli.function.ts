/**
 * Stackra file contract:
 * Purpose: `runCli(args, io, options?)`, the command core of `stackra`: a `@stackra/console` run (ADR 0506) over the
 *          commands: native console command classes as they are, each `CliCommand` as a passthrough `legacyCommand`.
 *          The console routes (help, `help <command>`, unknown names with the closest, `completion`), renders errors
 *          and exits 0 success, 1 failure, 2 usage. A name none of them takes may be a member's own console command
 *          (`topLevelMemberCommands`): `stackra db:status --json` runs it in its member, as
 *          `stackra console <member> db:status -- --json` does, and the list shows them under a heading per member.
 *          The binary and the local MCP both call it, so a person and an assistant pass the same commands and gates.
 * Boundary: never exits the process and never throws; every error is written to `io.err` and becomes an exit code.
 *           `io.inherit` false (the MCP, a pipe) counts as no terminal, so nothing prompts or animates.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 3 and 5); ADR 0083 (the `stackra` binary); ADR 0506 (decision 6); STA-1966;
 *                     STA-2888.
 */
import { createConsole } from "@stackra/console";
import { nodePorts } from "@stackra/console/node";

import { COMMANDS } from "#node/constants/commands.constant";
import { cliVersion } from "#node/functions/cli-version.function";
import { legacyCommand } from "#node/functions/legacy-command.function";
import { topLevelMemberCommands } from "#node/functions/top-level-member-commands.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { CliCommands } from "#node/types/cli-commands.type";
import type { CliIo } from "#node/types/cli-io.type";

/**
 * Runs one `stackra` command line and resolves with its exit code.
 *
 * @param args - the command line without the program name.
 * @param io - where the command writes.
 * @param options - `cwd` (default: the working directory) and `commands` (default: `COMMANDS`).
 * @example
 * process.exitCode = await runCli(process.argv.slice(2), PROCESS_IO);
 */
export async function runCli(
  args: readonly string[],
  io: CliIo,
  options: { readonly cwd?: string; readonly commands?: CliCommands } = {},
): Promise<number> {
  const commands = options.commands ?? COMMANDS;
  const cwd = options.cwd ?? process.cwd();
  const recurse = (next: readonly string[], nextIo: CliIo) =>
    runCli(next, nextIo, { cwd, commands });
  const ports = nodePorts();
  const builtins = commands.map((command) =>
    typeof command === "function"
      ? command
      : legacyCommand(command as CliCommand, recurse, io.inherit),
  );
  return createConsole({
    name: "stackra",
    version: cliVersion(),
    commands: [...builtins, ...topLevelMemberCommands(args, cwd, builtins)],
  }).run(args, {
    ...ports,
    cwd,
    stdout: { write: io.out },
    stderr: { write: io.err },
    stdoutIsTTY: io.inherit && ports.stdoutIsTTY,
    stdinIsTTY: io.inherit && ports.stdinIsTTY,
  });
}

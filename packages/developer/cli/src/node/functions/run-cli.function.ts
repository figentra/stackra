/**
 * Stackra file contract:
 * Purpose: `runCli(args, io, options?)`, the command core of `stackra`: help and version, finding the command, parsing
 *          its options with `node:util` `parseArgs` (strict; everything after `--` passed on untouched), running it, and
 *          turning the outcome into an exit code: 0 success, 1 failure, 2 usage error. The binary and the local MCP
 *          both call it, so a person and an assistant pass the same commands and gates.
 * Boundary: never exits the process and never throws; every error is printed to `io.err` and becomes an exit code.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 3 and 5); ADR 0083 (the `stackra` binary); POSIX exit status 2 for usage.
 */
import { parseArgs } from "node:util";

import { COMMANDS } from "#node/constants/commands.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { cliVersion } from "#node/functions/cli-version.function";
import { findCommand } from "#node/functions/find-command.function";
import { helpText } from "#node/functions/help-text.function";
import type { CliCommand } from "#node/types/cli-command.type";
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
  options: { readonly cwd?: string; readonly commands?: readonly CliCommand[] } = {},
): Promise<number> {
  const commands = options.commands ?? COMMANDS;
  const cwd = options.cwd ?? process.cwd();
  const first = args[0];

  if (first === undefined || first === "--help" || first === "-h" || first === "help") {
    io.out(helpText(commands));
    return 0;
  }
  if (first === "--version" || first === "-v") {
    io.out(`${cliVersion()}\n`);
    return 0;
  }

  const found = findCommand(commands, args);
  if (found === undefined) {
    io.err(`stackra: unknown command: ${first}\nRun \`stackra --help\` for the list.\n`);
    return 2;
  }
  const { command } = found;
  const split = found.rest.indexOf("--");
  const own = split === -1 ? found.rest : found.rest.slice(0, split);
  const rest = split === -1 ? [] : found.rest.slice(split + 1);

  try {
    const { values, positionals } = parseArgs({
      args: [...own],
      options: { ...command.options, help: { type: "boolean", short: "h" } },
      allowPositionals: command.positionals === true,
      strict: true,
    });
    if (values["help"] === true) {
      io.out(`${command.summary}\n\nUsage: ${command.usage}\n`);
      return 0;
    }
    return await command.run({
      cwd,
      io,
      values: values as Record<string, string | boolean | undefined>,
      positionals,
      rest,
      cli: (next, nextIo) => runCli(next, nextIo, { cwd, commands }),
    });
  } catch (error) {
    // parseArgs refuses an unknown option or a stray positional with an ERR_PARSE_ARGS_* TypeError.
    const code = (error as { code?: unknown }).code;
    if (
      error instanceof CliUsageError ||
      (typeof code === "string" && code.startsWith("ERR_PARSE_ARGS"))
    ) {
      io.err(`stackra ${command.name}: ${(error as Error).message}\nUsage: ${command.usage}\n`);
      return 2;
    }
    io.err(`stackra ${command.name}: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

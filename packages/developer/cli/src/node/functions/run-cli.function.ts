/**
 * Stackra file contract:
 * Purpose: `runCli(args, io, options?)`, the command core of `stackra`: a `@stackra/console` run (ADR 0506) over the
 *          command classes, run inside `CLI_RUNTIME_STORE` with this run's `CliRuntime` (its tools take the terminal
 *          only when `io.inherit`; `context.cli` runs the same commands from the same folder).
 *          The console routes (help, `help <command>`, unknown names with the closest, `completion`), renders errors
 *          and exits 0 success, 1 failure, 2 usage. The list shows the `COMMAND_GROUPS` headings in order and leaves
 *          out what `unlistedCommand` names for this workspace (`stackra list --all` shows everything). The binary and the local MCP both call it, so a person and an
 *          assistant pass the same commands and gates.
 * Boundary: never exits the process and never throws; every error is written to `io.err` and becomes an exit code.
 *           `io.inherit` false (the MCP, a pipe) counts as no terminal, so nothing prompts or animates.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 3 and 5); ADR 0083 (the `stackra` binary); ADR 0506; STA-1966; STA-2872
 *                     spec FR-001 and FR-002; STA-2883.
 */
import { createConsole } from "@stackra/console";
import { nodePorts } from "@stackra/console/node";

import { CLI_RUNTIME_STORE } from "#node/constants/cli-runtime-store.constant";
import { COMMAND_GROUPS } from "#node/constants/command-groups.constant";
import { COMMANDS } from "#node/constants/commands.constant";
import { cliVersion } from "#node/functions/cli-version.function";
import { unlistedCommand } from "#node/functions/unlisted-command.function";
import type { CliCommands } from "#node/types/cli-commands.type";
import type { CliIo } from "#node/types/cli-io.type";
import type { CliRuntime } from "#node/types/cli-runtime.type";

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
  const runtime: CliRuntime = {
    inherit: io.inherit,
    cli: (next, nextIo, from) => runCli(next, nextIo, { cwd: from, commands }),
  };
  const ports = nodePorts();
  const app = createConsole({
    name: "stackra",
    version: cliVersion(),
    commands,
    groups: COMMAND_GROUPS,
    unlisted: unlistedCommand(cwd),
  });
  return CLI_RUNTIME_STORE.run(runtime, () =>
    app.run(args, {
      ...ports,
      cwd,
      stdout: { write: io.out },
      stderr: { write: io.err },
      stdoutIsTTY: io.inherit && ports.stdoutIsTTY,
      stdinIsTTY: io.inherit && ports.stdinIsTTY,
    }),
  );
}

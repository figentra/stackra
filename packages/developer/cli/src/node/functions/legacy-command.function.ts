/**
 * Stackra file contract:
 * Purpose: `legacyCommand(command, recurse, inherit)`, a `CliCommand` that still parses its own line, as a `@stackra/console`
 *          passthrough command: the name has `:` for spaces (`mcp sync` is `mcp:sync`; the kernel joins spaced words, so
 *          `stackra mcp sync` still works), the summary is its description and the usage its one example. Its `handle`
 *          does what `runCli` did: split the raw tokens at `--`, `parseArgs` strictly, run it with the run's streams and
 *          return its exit code, a usage error becoming the console's `UsageError` (exit 2).
 * Boundary: migration only (ADR 0500 decision 7); a command leaves it by becoming a native console command class.
 *           Output stays byte-identical: the command writes through `io.stdout` and `io.stderr`.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0506; ADR 0500 (decision 7); STA-1966 spec FR-024.
 */
import { parseArgs } from "node:util";

import { Command, UsageError, type CommandClass, type CommandIo } from "@stackra/console";

import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliCommand } from "#node/types/cli-command.type";
import type { CliContext } from "#node/types/cli-context.type";

/**
 * The console command class that runs a `CliCommand`.
 *
 * @param command - the command to wrap.
 * @param recurse - runs another `stackra` command line, for `context.cli`.
 * @example
 * const commands = COMMANDS.map((command) => legacyCommand(command, recurse, io.inherit));
 */
export function legacyCommand(
  command: CliCommand,
  recurse: CliContext["cli"],
  inherit: boolean,
): CommandClass {
  const usage = `Usage: ${command.usage}`;
  return class LegacyCommand extends Command({
    name: command.name.replaceAll(" ", ":"),
    description: command.summary,
    examples: [command.usage],
    passthrough: true,
  }) {
    /** Parses and runs the wrapped command; an exit code is its own. */
    async handle(io: CommandIo): Promise<number> {
      const split = io.rest.indexOf("--");
      const own = split === -1 ? io.rest : io.rest.slice(0, split);
      const rest = split === -1 ? [] : io.rest.slice(split + 1);
      try {
        const { values, positionals } = parseArgs({
          args: [...own],
          options: command.options ?? {},
          allowPositionals: command.positionals === true,
          strict: true,
        });
        return await command.run({
          cwd: io.cwd,
          io: {
            out: (text) => io.stdout.write(text),
            err: (text) => io.stderr.write(text),
            // The caller's own answer (the binary: true, an MCP capture: false), so children stream as before, CI included.
            inherit,
          },
          values: values as Record<string, string | boolean | undefined>,
          positionals,
          rest,
          cli: recurse,
        });
      } catch (error) {
        // parseArgs refuses an unknown option or a stray positional with an ERR_PARSE_ARGS_* TypeError.
        const code = (error as { code?: unknown }).code;
        if (
          error instanceof CliUsageError ||
          (typeof code === "string" && code.startsWith("ERR_PARSE_ARGS"))
        )
          throw new UsageError((error as Error).message, usage);
        throw error;
      }
    }
  };
}

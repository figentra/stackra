/**
 * Stackra file contract:
 * Purpose: `runToolCommand(io, context, args, options)`, the body of every local MCP tool that runs a `stackra`
 *          command: resolves the member it names, runs the command through the host's CLI runner (`toolRun`), sets the
 *          `--json` data to the run's structured result plus what `read` parses from the full output, and resolves
 *          with 0 when the command passed, 1 when it failed, so the tool result carries both the data and `isError`.
 * Boundary: runs only through `host.run`; refuses with a `CommandError` when the command was built without the
 *           server's host (it runs inside `stackra mcp` only) or names an unknown member.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: writes go through the same commands and gates as the CLI); STA-2873.
 */
import { CommandError, type CommandIo } from "@stackra/console";

import type { DevToolHost } from "#core/ports/dev-tool-host.port";

import { resolveMember } from "#node/functions/resolve-member.function";
import { toolRun } from "#node/functions/tool-run.function";

/**
 * Runs `stackra <args>` for a tool and writes its structured result.
 *
 * @param io - the command's io; `io.cwd` is the repository root.
 * @param host - the server's runner and environment, or undefined outside `stackra mcp`.
 * @param args - the command line without the program name.
 * @param options - the member to run in (a key, package name or folder) and the parser of the full output.
 * @throws CommandError when `host` is missing or the member is unknown.
 * @example
 * const read = (output: string) => diagnosticsOf(parseDiagnostics(output));
 * return runToolCommand(io, this.host, ["lint"], { member: this.member, read });
 */
export async function runToolCommand(
  io: CommandIo,
  host: DevToolHost | undefined,
  args: readonly string[],
  options: {
    readonly member?: string | undefined;
    readonly read?: (output: string) => Readonly<Record<string, unknown>>;
  } = {},
): Promise<number> {
  if (host === undefined)
    throw new CommandError("This tool runs inside the local MCP only", { fix: "stackra mcp" });
  const member = options.member === undefined ? undefined : resolveMember(io.cwd, options.member);
  const { result, output } = await toolRun(host, io.cwd, args, member);
  io.output.json({ ...result, ...options.read?.(output) });
  return result.ok ? 0 : 1;
}

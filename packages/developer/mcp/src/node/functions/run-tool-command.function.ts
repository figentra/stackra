/**
 * Stackra file contract:
 * Purpose: `runToolCommand(io, context, args, options)`, the body of every local MCP tool that runs a `stackra`
 *          command: resolves the member it names, runs the command through the host's CLI runner (`toolRun`), writes
 *          the full log to `.stackra/logs/last-<tool>.log`, and sets the `--json` data to the run's structured result,
 *          what `read` parses from the full output, and its findings as `Diagnostic`s (counted and capped by
 *          `diagnosticsOf`); resolves with 0 when the command passed, 1 when it failed, so the tool result carries both
 *          the data and `isError`. A file a finding names in a member's run is made relative to the repository root.
 *          A failed run whose output gave no error diagnostic still gets one, `command_failed`, with the last line it
 *          printed and the log to read, so a failure is never an empty list.
 * Boundary: runs only through `host.run`; writes the tool's log and nothing else. Refuses with a `CommandError` when
 *           the command was built without the server's host (it runs inside `stackra mcp` only) or names an unknown
 *           member.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: writes go through the same commands and gates as the CLI); STA-2873;
 *                     STA-2886 (one Diagnostic shape, the log on disk).
 */
import { isAbsolute, posix } from "node:path";

import { CommandError, type CommandIo } from "@stackra/console";
import type { Diagnostic } from "@stackra/console/contracts";

import type { DevToolHost } from "#core/ports/dev-tool-host.port";

import { diagnosticsOf } from "#node/functions/diagnostics-of.function";
import { resolveMember } from "#node/functions/resolve-member.function";
import { toolRun } from "#node/functions/tool-run.function";
import { writeToolLog } from "#node/functions/write-tool-log.function";

/** What a tool reads from a run's full output: its findings, and any data of its own. */
type ToolReading = Readonly<Record<string, unknown>> & {
  readonly diagnostics?: readonly Diagnostic[];
};

/** The last line a run printed that is not blank, cut to one sentence's length. */
function lastLine(output: string): string | undefined {
  const lines = output.split(/\r?\n/);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = (lines[index] ?? "").trim();
    if (line !== "") return line.slice(0, 300);
  }
  return undefined;
}

/**
 * Runs `stackra <args>` for a tool and writes its structured result.
 *
 * @param io - the command's io; `io.cwd` is the repository root.
 * @param host - the server's runner and environment, or undefined outside `stackra mcp`.
 * @param args - the command line without the program name; the first word names the tool and its log.
 * @param options - the member to run in (a key, package name or folder) and the parser of the full output.
 * @throws CommandError when `host` is missing or the member is unknown.
 * @example
 * const read = (output: string) => ({ diagnostics: parseDiagnostics(output, "lint") });
 * return runToolCommand(io, this.host, ["lint"], { member: this.member, read });
 */
export async function runToolCommand(
  io: CommandIo,
  host: DevToolHost | undefined,
  args: readonly string[],
  options: {
    readonly member?: string | undefined;
    readonly read?: (output: string) => ToolReading;
  } = {},
): Promise<number> {
  if (host === undefined)
    throw new CommandError("This tool runs inside the local MCP only", { fix: "stackra mcp" });
  const tool = args[0] ?? "stackra";
  const member = options.member === undefined ? undefined : resolveMember(io.cwd, options.member);
  const { result, output } = await toolRun(host, io.cwd, args, member);
  const log = await writeToolLog(io.cwd, tool, result, output);
  const { diagnostics: read = [], ...data } = options.read?.(output) ?? {};
  // A member's tool prints paths from its own folder; a finding names its file from the repository root.
  const found = read.map((diagnostic) =>
    member === undefined || diagnostic.file === undefined || isAbsolute(diagnostic.file)
      ? diagnostic
      : { ...diagnostic, file: posix.join(member.path, diagnostic.file) },
  );
  if (!result.ok && !found.some((diagnostic) => diagnostic.severity === "error")) {
    const printed = lastLine(output);
    found.push({
      phase: tool,
      code: "command_failed",
      severity: "error",
      message: `${result.command} exited ${result.exitCode}${printed === undefined ? "" : `: ${printed}`}`,
      fix: log === undefined ? `run ${result.command} to see its output` : `read ${log}`,
    });
  }
  io.output.json({
    ...result,
    ...(log === undefined ? {} : { log }),
    ...data,
    ...diagnosticsOf(found),
  });
  return result.ok ? 0 : 1;
}

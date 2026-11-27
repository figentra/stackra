/**
 * Stackra file contract:
 * Purpose: `toolRun(host, root, args, member?)`, one `stackra` command run for a tool: through the host's CLI
 *          runner, in the repository root or one member's folder, timed, with its output stripped of colour codes,
 *          redacted with `@stackra/logger`'s `redact` (secret shapes: bearer tokens, JWTs, API keys, URL
 *          credentials) and cut to the tail when it is long.
 * Boundary: runs only through `host.run`, so the CLI's commands and gates apply; never spawns anything itself.
 *           Returns the full output beside the result, for the parsers and the log, and keeps only the tail in the
 *           result; both are redacted here, before anything reads, writes or returns them, and so is the command
 *           line.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: writes go through the same commands and gates as the CLI); ADR 0147
 *                     (decision 1: redaction with secret detection); STA-2873; STA-2886.
 */
import { join } from "node:path";
import { stripVTControlCharacters } from "node:util";

import { redact } from "@stackra/logger";

import type { DevToolHost } from "#core/ports/dev-tool-host.port";
import { OUTPUT_LIMIT } from "#node/constants/output-limit.constant";
import type { ToolRunResult } from "#node/types/tool-run-result.type";
import type { ManifestMember } from "#node/types/manifest-member.type";

/**
 * Runs `stackra <args>` and resolves with its structured result and its full plain output.
 *
 * @param host - the runner.
 * @param root - the repository root.
 * @param args - the command line without the program name.
 * @param member - the member to run in; the root when absent.
 * @example
 * const { result, output } = await toolRun(host, "/repo", ["test", "--tier=unit"], member);
 */
export async function toolRun(
  host: DevToolHost,
  root: string,
  args: readonly string[],
  member?: ManifestMember,
): Promise<{ readonly result: ToolRunResult; readonly output: string }> {
  const started = performance.now();
  const outcome = await host.run(
    args,
    member === undefined ? undefined : { cwd: join(root, member.dir) },
  );
  // Redacted once, here: the parsers, the log file and the result's tail all read this text.
  const output = redact(stripVTControlCharacters(outcome.output)) as string;
  const cut = output.length - OUTPUT_LIMIT;
  return {
    output,
    result: {
      command: redact(["stackra", ...args].join(" ")) as string,
      cwd: member?.dir ?? ".",
      exitCode: outcome.exitCode,
      ok: outcome.exitCode === 0,
      durationMs: Math.round(performance.now() - started),
      output:
        cut > 0 ? `… (${cut} earlier characters cut)\n${output.slice(-OUTPUT_LIMIT)}` : output,
    },
  };
}

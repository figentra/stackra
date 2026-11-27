/**
 * Stackra file contract:
 * Purpose: `devLogTee(file, member, onError)`, the copy of a dev tool's output `stackra dev` keeps in the dev log:
 *          `write(stream, text)` takes output chunks as they arrive, splits them into lines (holding a partial line
 *          until its newline), turns each into an entry (`devLogEntryOf`) and appends them in one write
 *          (`appendDevLog`, which redacts); `end()` writes what is left. It also writes one line when the tool starts
 *          and one when it ends, so a reader can tell the runs apart.
 * Boundary: never throws into the dev tool's output path: a write that fails is reported once through `onError` and
 *           the tee goes quiet, so the server keeps running and printing.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); ADR 0296 (decision 1); ADR 0147 (decision 1); STA-2889.
 */
import type { DevLogEntry } from "@stackra/runway";
import { appendDevLog } from "@stackra/runway/node";

import { devLogEntryOf } from "#node/functions/dev-log-entry-of.function";
import type { DevLogTee } from "#node/types/dev-log-tee.type";

/** An output stream of the tool. */
type Stream = "stdout" | "stderr";

/**
 * A tee into the dev log at `file` for the dev tool of `member`.
 *
 * @param file - the dev log, `devLogFile(cwd)`.
 * @param member - the member folder relative to the repository root.
 * @param command - the tool command line, named in the start line.
 * @param onError - told once when the log cannot be written.
 * @example
 * const tee = devLogTee(devLogFile(cwd), "apps/console", "vite", (error) => io.err(`${error.message}\n`));
 * const code = await runProcess({ ...tool, tee: tee.write }, io);
 * tee.end(code);
 */
export function devLogTee(
  file: string,
  member: string,
  command: string,
  onError: (error: Error) => void,
): DevLogTee {
  const pending: Record<Stream, string> = { stdout: "", stderr: "" };
  const previous: Partial<Record<Stream, DevLogEntry["level"]>> = {};
  let failed = false;

  const append = (entries: readonly DevLogEntry[]): void => {
    if (failed || entries.length === 0) return;
    try {
      appendDevLog(file, entries);
    } catch (error) {
      failed = true;
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const entriesOf = (stream: Stream, lines: readonly string[]): DevLogEntry[] => {
    const time = new Date().toISOString();
    return lines.flatMap((line) => {
      const entry = devLogEntryOf(line, { stream, member, time, previous: previous[stream] });
      if (entry === undefined) return [];
      previous[stream] = entry.level;
      return [entry];
    });
  };

  const note = (level: DevLogEntry["level"], message: string): DevLogEntry => ({
    time: new Date().toISOString(),
    source: "server",
    level,
    member,
    message,
  });

  append([note("info", `stackra dev: started ${command}`)]);
  return {
    write(stream, text) {
      const lines = (pending[stream] + text).split(/\r?\n/);
      pending[stream] = lines.pop() ?? "";
      append(entriesOf(stream, lines));
    },
    end(exitCode) {
      const rest = (["stdout", "stderr"] as const).flatMap((stream) => {
        const line = pending[stream];
        pending[stream] = "";
        return entriesOf(stream, [line]);
      });
      append([
        ...rest,
        exitCode === 0
          ? note("info", `stackra dev: ${command} ended`)
          : note("warn", `stackra dev: ${command} ended with exit code ${exitCode ?? "unknown"}`),
      ]);
    },
  };
}

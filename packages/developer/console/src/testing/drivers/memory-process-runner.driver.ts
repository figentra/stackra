/**
 * Stackra file contract:
 * Purpose: `MemoryProcessRunnerDriver`, a `ProcessRunner` for tests: answers each scripted command line with its exit
 *          code and output (fed to the output listener as one chunk), records every call, and answers an unscripted
 *          line with exit 127.
 * Boundary: runs nothing.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-007 and FR-028.
 */
import { Driver } from "@stackra/container";

import { ProcessRunner } from "#contracts/ports/process-runner.port";
import type { ProcessResult } from "#contracts/types/process-result.type";
import type { ProcessRunOptions } from "#contracts/types/process-run-options.type";

/**
 * Scripted child processes.
 *
 * @example
 * const runner = new MemoryProcessRunnerDriver().on("git status", { output: "clean\n" });
 * await runCommandForTest([StatusCommand], ["status"], { process: runner });
 * expect(runner.calls[0]?.cwd).toBe("/work");
 */
export class MemoryProcessRunnerDriver extends Driver(ProcessRunner) {
  /** Every run, oldest first: the command line and its options. */
  readonly calls: (ProcessRunOptions & { readonly line: string; readonly cwd: string })[] = [];

  /** The scripted results, by command line. */
  private readonly results = new Map<string, ProcessResult>();

  /** Answers `line` (the command and its arguments joined by spaces) with `result`; returns this driver. */
  on(line: string, result: Partial<ProcessResult> = {}): this {
    this.results.set(line, { code: result.code ?? 0, output: result.output ?? "" });
    return this;
  }

  /** Records the call and answers with the scripted result, or exit 127 when none is scripted. */
  async run(
    command: string,
    args: readonly string[],
    options: ProcessRunOptions & { readonly cwd: string },
  ): Promise<ProcessResult> {
    const line = [command, ...args].join(" ");
    this.calls.push({ ...options, line });
    const result = this.results.get(line) ?? { code: 127, output: `${command}: not scripted\n` };
    if (result.output !== "") options.onOutput?.(result.output);
    return result;
  }
}

/**
 * Stackra file contract:
 * Purpose: `NodeProcessRunnerDriver`, the `ProcessRunner` of a real process: spawns the child with no shell, captures
 *          its standard output and error interleaved (standard input closed, so it never waits on a prompt), or hands
 *          it the terminal when it is interactive or inherits it (`inherit: "stderr"`: standard input ignored, both
 *          outputs on standard error); a command that cannot start resolves as exit 127 with the reason.
 * Boundary: prints nothing itself; the console decides what of the output is shown.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-007 and FR-028; ADR 0506 (amendment 2026-11-03).
 */
import { spawn } from "node:child_process";

import { Driver } from "@stackra/container";

import { ProcessRunner } from "#contracts/ports/process-runner.port";
import type { ProcessResult } from "#contracts/types/process-result.type";
import type { ProcessRunOptions } from "#contracts/types/process-run-options.type";

/** Runs child processes of this machine. */
export class NodeProcessRunnerDriver extends Driver(ProcessRunner) {
  /** Spawns `command` with `args` and resolves with its exit code and output once it exits. */
  run(
    command: string,
    args: readonly string[],
    options: ProcessRunOptions & { readonly cwd: string },
  ): Promise<ProcessResult> {
    return new Promise((resolve) => {
      let output = "";
      const take = (chunk: string) => {
        output += chunk;
        options.onOutput?.(chunk);
      };
      const child = spawn(command, [...args], {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        // "stderr" wins over interactive, so stdout stays clean for a --json document.
        stdio:
          options.inherit === "stderr"
            ? ["ignore", 2, 2]
            : options.interactive === true || options.inherit === true
              ? "inherit"
              : ["ignore", "pipe", "pipe"],
      });
      child.stdout?.setEncoding("utf8").on("data", take);
      child.stderr?.setEncoding("utf8").on("data", take);
      child.on("error", (error) =>
        resolve({ code: 127, output: `${output}${command}: ${error.message}\n` }),
      );
      child.on("close", (code) => resolve({ code: code ?? 1, output }));
    });
  }
}

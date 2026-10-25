/**
 * Stackra file contract:
 * Purpose: `spawnStackra(root)`, the default `StackraRunner`: runs the `stackra` binary (on PATH under
 *          `pnpm exec stackra mcp`) in the repository root and collects its exit code and combined output.
 * Boundary: runs the CLI without a shell, so an argument is never parsed as shell syntax; never reads a secret.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: writes go through the CLI's commands and gates); ADR 0083 (`stackra`).
 */
import { spawn } from "node:child_process";

import type { StackraRunner } from "#node/types/stackra-runner.type";

/**
 * A runner that spawns `stackra` in `root`.
 *
 * @param root - the repository root, the commands' working directory.
 * @example
 * const { exitCode, output } = await spawnStackra(process.cwd())(["validate"]);
 */
export function spawnStackra(root: string): StackraRunner {
  return (args) =>
    new Promise((resolve) => {
      let output = "";
      const child = spawn("stackra", [...args], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
      child.stdout.setEncoding("utf8").on("data", (chunk: string) => (output += chunk));
      child.stderr.setEncoding("utf8").on("data", (chunk: string) => (output += chunk));
      // The first settle wins: a spawn failure (no `stackra` on PATH) also emits `close`.
      child.on("error", (error) =>
        resolve({ exitCode: 127, output: `${output}${error.message}\n` }),
      );
      child.on("close", (code) => resolve({ exitCode: code ?? 1, output }));
    });
}

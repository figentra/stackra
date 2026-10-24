/**
 * Stackra file contract:
 * Purpose: `execWithSecrets(argv, options?)`, what `stackra mcp exec -- <argv>` does: starts the command
 *          `mcpExecCommand` builds with this process's stdio, so an MCP client talks straight to the server, and
 *          resolves with its exit code.
 * Boundary: never reads, prints or logs a value: Infisical puts the values into the child's environment and the
 *           child's shell expands them. A command naming no secret starts unchanged.
 * Runtime: node
 * Governing contract: ADR 0173; ADR 0257; ADR 0282 (decision 3); the template's `.mcp.yaml` contract.
 */
import { spawn } from "node:child_process";

import { mcpExecCommand } from "#core/functions/mcp-exec-command.function";
import type { McpExecOptions } from "#core/types/mcp-exec-options.type";

/**
 * Runs `argv` with its secrets and resolves with the exit code.
 *
 * @param argv - the program and arguments written after `stackra mcp exec --`.
 * @param options - the Infisical environment and folder, and the working directory.
 * @throws Error when `argv` is empty, or rejects when the program (or `infisical`) cannot start.
 * @example
 * process.exitCode = await execWithSecrets(["npx", "-y", "mcp-remote@0.14.3", url, "--header", "x-token:$TOKEN"]);
 */
export function execWithSecrets(
  argv: readonly string[],
  options: McpExecOptions & { readonly cwd?: string } = {},
): Promise<number> {
  const { command, args } = mcpExecCommand(argv, options);
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], { cwd: options.cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

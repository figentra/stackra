/**
 * Stackra file contract:
 * Purpose: `MCP_EXEC_COMMAND`, `stackra mcp exec [--env <env>] [--path <folder>] -- <argv>`: starts an MCP server
 *          with its secrets. A `$NAME` in `argv` is expanded by the server's own shell under `infisical run`; a command
 *          naming no secret starts unchanged. Exits with the server's exit code.
 * Boundary: `--env` and `--path` name where values live (default `dev` and `/agents`), never a value; no value passes
 *           through this process, its output or its arguments.
 * Runtime: node
 * Governing contract: ADR 0173; ADR 0257; ADR 0282 (decision 3); the template's `.mcp.yaml` contract.
 */
import { execWithSecrets } from "@stackra/mcp/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra mcp exec`. */
export const MCP_EXEC_COMMAND: CliCommand = {
  name: "mcp exec",
  summary: "Start an MCP server with its secrets (stackra mcp exec -- <command>)",
  usage: "stackra mcp exec [--env <env>] [--path <folder>] -- <command> [args…]",
  options: {
    env: { type: "string" },
    path: { type: "string" },
  },
  async run({ cwd, values, rest }) {
    if (rest.length === 0) throw new CliUsageError("name the server command after --");
    const environment = values["env"];
    const path = values["path"];
    return execWithSecrets(rest, {
      cwd,
      ...(typeof environment === "string" ? { environment } : {}),
      ...(typeof path === "string" ? { path } : {}),
    });
  },
};

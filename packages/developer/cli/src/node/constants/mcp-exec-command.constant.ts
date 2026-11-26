/**
 * Stackra file contract:
 * Purpose: `MCP_EXEC_COMMAND`, `stackra mcp exec -- <argv>`: starts an MCP server with its secrets. A `$NAME` in
 *          `argv` is decrypted by `sops exec-env` from the `agents` scope of the local figentra/secrets clone
 *          (`$STACKRA_SECRETS_DIR`, default `~/.stackra/secrets`) and expanded by the server's own shell; a command
 *          naming no secret starts unchanged. Exits with the server's exit code.
 * Boundary: no value passes through this process, its output or its arguments.
 * Runtime: node
 * Governing contract: ADR 0173; ADR 0257; ADR 0282 (decision 3); ADR 0525; the template's `.mcp.yaml` contract.
 */
import { execWithSecrets } from "@stackra/mcp/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra mcp exec`. */
export const MCP_EXEC_COMMAND: CliCommand = {
  name: "mcp exec",
  summary: "Start an MCP server with its secrets (stackra mcp exec -- <command>)",
  usage: "stackra mcp exec -- <command> [args…]",
  options: {},
  async run({ cwd, rest }) {
    if (rest.length === 0) throw new CliUsageError("name the server command after --");
    return execWithSecrets(rest, { cwd });
  },
};

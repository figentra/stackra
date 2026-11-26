/**
 * Stackra file contract:
 * Purpose: `MCP_EXEC_COMMAND`, `stackra mcp exec [--env NAME[,NAME…]] -- <argv>`: starts an MCP server with its
 *          secrets. Each `--env` name is decrypted by `sops exec-env` from the `agents` scope of the local
 *          figentra/secrets clone (`$STACKRA_SECRETS_DIR`, default `~/.stackra/secrets`) into the server's
 *          environment, where the server reads it; a `$NAME` in `argv` is refused, since expanded it would sit on the
 *          server's argv (STA-1617). A command naming no secret starts unchanged. Exits with the server's exit code.
 * Boundary: no value passes through this process, its output or any argument.
 * Runtime: node
 * Governing contract: ADR 0173; ADR 0257; ADR 0282 (decision 3); ADR 0525; the template's `.mcp.yaml` contract;
 *                     STA-1617.
 */
import { execWithSecrets } from "@stackra/mcp/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra mcp exec`. */
export const MCP_EXEC_COMMAND: CliCommand = {
  name: "mcp exec",
  summary:
    "Start an MCP server with its secrets in its environment (stackra mcp exec --env NAME -- <command>)",
  usage: "stackra mcp exec [--env NAME[,NAME…]] -- <command> [args…]",
  options: { env: { type: "string" } },
  async run({ cwd, rest, values }) {
    if (rest.length === 0) throw new CliUsageError("name the server command after --");
    const env = values["env"];
    if (env === true || env === "") throw new CliUsageError("--env takes NAME[,NAME…]");
    const secrets = typeof env === "string" ? env.split(",").filter(Boolean) : [];
    return execWithSecrets(rest, secrets.length > 0 ? { cwd, secrets } : { cwd });
  },
};

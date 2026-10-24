/**
 * Stackra file contract:
 * Purpose: `MCP_SYNC_COMMAND`, `stackra mcp sync` (the template's `prepare`): checks `.mcp.yaml` in the working
 *          directory and writes the gitignored `.mcp.json` from it when the text differs.
 * Boundary: writes `.mcp.json` only; an invalid `.mcp.yaml` leaves it as it was and exits 1 with every issue.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 10: sync writes the `.mcp.json` rendered from `.mcp.yaml`).
 */
import { syncMcpConfig } from "@stackra/mcp/node";

import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra mcp sync`. */
export const MCP_SYNC_COMMAND: CliCommand = {
  name: "mcp sync",
  summary: "Render .mcp.json from .mcp.yaml",
  usage: "stackra mcp sync",
  async run({ cwd, io }) {
    const { file, changed } = syncMcpConfig(cwd);
    io.out(changed ? `wrote ${file}\n` : `${file} is up to date\n`);
    return 0;
  },
};

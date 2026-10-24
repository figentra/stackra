/**
 * Stackra file contract:
 * Purpose: `AGENTS_SYNC_COMMAND`, `stackra agents sync`: writes the project's generated agent files. Of the project
 *          files of ADR 0282 decision 9, `AGENTS.md`, `CLAUDE.md` and `.mcp.yaml` are authored, so the one written
 *          file is `.mcp.json`, rendered from `.mcp.yaml`.
 * Boundary: writes `.mcp.json` only, and only when it changed; never a user-level file (that is `agents setup`).
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 9 and 10: sync writes only the project files and `.mcp.json`).
 */
import { syncMcpConfig } from "@stackra/mcp/node";

import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra agents sync`. */
export const AGENTS_SYNC_COMMAND: CliCommand = {
  name: "agents sync",
  summary: "Write the project's generated agent files (.mcp.json)",
  usage: "stackra agents sync",
  async run({ cwd, io }) {
    const { file, changed } = syncMcpConfig(cwd);
    io.out(changed ? `wrote ${file}\n` : `${file} is up to date\n`);
    return 0;
  },
};

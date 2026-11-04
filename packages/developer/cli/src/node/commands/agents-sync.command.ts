/**
 * Stackra file contract:
 * Purpose: `AgentsSyncCommand`, `stackra agents sync`: writes the project's generated agent files. Of the project
 *          files of ADR 0282 decision 9, `AGENTS.md`, `CLAUDE.md` and `.mcp.yaml` are authored, so the one written
 *          file is `.mcp.json`, rendered from `.mcp.yaml`. The `--json` data is the file and whether it changed.
 * Boundary: writes `.mcp.json` only, and only when it changed; never a user-level file (that is `agents setup`).
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 9 and 10: sync writes only the project files and `.mcp.json`); ADR 0506;
 *                     STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";
import { syncMcpConfig } from "@stackra/mcp/node";

/** Writes the project's generated agent files. */
export class AgentsSyncCommand extends Command({
  name: "agents:sync",
  description: "Write the project's generated agent files (.mcp.json)",
  bin: true,
}) {
  /** Renders `.mcp.json`; returns the file and whether it changed. */
  handle(io: CommandIo): { readonly file: string; readonly changed: boolean } {
    const { file, changed } = syncMcpConfig(io.cwd);
    if (changed) io.output.success(`wrote ${file}`);
    else io.output.info(`${file} is up to date`);
    return { file, changed };
  }
}

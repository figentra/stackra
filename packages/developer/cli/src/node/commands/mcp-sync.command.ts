/**
 * Stackra file contract:
 * Purpose: `McpSyncCommand`, `stackra mcp sync` (the template's `prepare`): checks `.mcp.yaml` in the working
 *          directory and writes the gitignored `.mcp.json` from it when the text differs. The `--json` data is the
 *          file and whether it changed.
 * Boundary: writes `.mcp.json` only; an invalid `.mcp.yaml` leaves it as it was and exits 1 with every issue.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 10: sync writes the `.mcp.json` rendered from `.mcp.yaml`); ADR 0506;
 *                     STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";
import { syncMcpConfig } from "@stackra/mcp/node";

/** Renders `.mcp.json` from `.mcp.yaml`. */
export class McpSyncCommand extends Command({
  name: "mcp:sync",
  description: "Render .mcp.json from .mcp.yaml",
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

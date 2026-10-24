/**
 * Stackra file contract:
 * Purpose: `syncMcpConfig(root?)`, what `stackra mcp sync` (the template's `prepare`) does: checks `<root>/.mcp.yaml`
 *          and writes the gitignored `<root>/.mcp.json` from it when the text differs.
 * Boundary: writes `.mcp.json` only, and only when it changed; never a value, since `.mcp.yaml` holds names only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 10: sync writes the `.mcp.json` rendered from `.mcp.yaml`).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { renderMcpJson } from "#core/functions/render-mcp-json.function";
import { readMcpConfig } from "#node/functions/read-mcp-config.function";

/**
 * Renders `.mcp.json` from `.mcp.yaml` in `root`.
 *
 * @param root - the repository root; defaults to the working directory.
 * @returns the written file and whether its text changed.
 * @throws McpConfigInvalidError when `.mcp.yaml` is missing or invalid; `.mcp.json` is then left as it was.
 * @example
 * const { changed } = syncMcpConfig(); // run by `pnpm install` through `prepare`
 */
export function syncMcpConfig(root = process.cwd()): {
  readonly file: string;
  readonly changed: boolean;
} {
  const text = renderMcpJson(readMcpConfig(join(root, ".mcp.yaml")));
  const file = join(root, ".mcp.json");
  const changed = !existsSync(file) || readFileSync(file, "utf8") !== text;
  if (changed) writeFileSync(file, text);
  return { file, changed };
}

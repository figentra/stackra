/**
 * Stackra file contract:
 * Purpose: `checkMcpConfig(root?)`, the drift check `stackra agents check` runs: whether `<root>/.mcp.json` is exactly
 *          the text `.mcp.yaml` renders to.
 * Boundary: reads only; `syncMcpConfig` repairs drift.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 10 and enforcement: `stackra agents check` fails on drift between
 *                     `.mcp.yaml` and `.mcp.json`).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { renderMcpJson } from "#core/functions/render-mcp-json.function";
import { readMcpConfig } from "#node/functions/read-mcp-config.function";

/**
 * Whether `.mcp.json` matches `.mcp.yaml` in `root`.
 *
 * @param root - the repository root; defaults to the working directory.
 * @throws McpConfigInvalidError when `.mcp.yaml` is missing or invalid.
 * @example
 * if (!checkMcpConfig()) throw new Error(".mcp.json drifted from .mcp.yaml: run `stackra mcp sync`");
 */
export function checkMcpConfig(root = process.cwd()): boolean {
  const expected = renderMcpJson(readMcpConfig(join(root, ".mcp.yaml")));
  const file = join(root, ".mcp.json");
  return existsSync(file) && readFileSync(file, "utf8") === expected;
}

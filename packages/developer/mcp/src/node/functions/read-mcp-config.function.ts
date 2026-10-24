/**
 * Stackra file contract:
 * Purpose: `readMcpConfig(file)`, a `.mcp.yaml` read from disk, parsed as YAML (duplicate keys refused) and checked by
 *          `parseMcpConfig`.
 * Boundary: reads one file; never writes.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 9 and 10).
 */
import { readFileSync } from "node:fs";

import { parse } from "yaml";

import { McpConfigInvalidError } from "#core/errors/mcp-config-invalid.error";
import { parseMcpConfig } from "#core/functions/parse-mcp-config.function";
import type { McpConfig } from "#core/types/mcp-config.type";

/**
 * The checked `.mcp.yaml` at `file`.
 *
 * @param file - the path of a `.mcp.yaml`.
 * @throws McpConfigInvalidError when the file cannot be read, is not YAML, or breaks the shape or rules.
 * @example
 * readMcpConfig(".mcp.yaml").mcpServers.encore; // { command: "encore", args: ["mcp", "run", "--app=acme-platform"] }
 */
export function readMcpConfig(file: string): McpConfig {
  let document: unknown;
  try {
    document = parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new McpConfigInvalidError(file, [
      {
        path: "",
        code: "not_readable",
        message: `Not readable as YAML: ${(error as Error).message}`,
      },
    ]);
  }
  return parseMcpConfig(document, file);
}

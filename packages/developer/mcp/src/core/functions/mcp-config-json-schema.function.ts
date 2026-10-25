/**
 * Stackra file contract:
 * Purpose: `mcpConfigJsonSchema()`, the JSON Schema of `.mcp.yaml` that the static host serves at
 *          `https://static.stackra.figentra.com/schemas/mcp.json` for the editor's `yaml-language-server` comment.
 * Boundary: derived from `MCP_CONFIG_SCHEMA`, so the editor and `parseMcpConfig` cannot drift; the rules of
 *           `ruleIssues` are not in it.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 9); ADR 0284 (hosted static files).
 */
import { z } from "zod";

import { MCP_CONFIG_SCHEMA } from "#core/constants/mcp-config-schema.constant";

/**
 * The `.mcp.yaml` JSON Schema.
 *
 * @example
 * writeFileSync("schemas/mcp.json", `${JSON.stringify(mcpConfigJsonSchema(), null, 2)}\n`);
 */
export function mcpConfigJsonSchema(): Record<string, unknown> & { $id: string } {
  return {
    ...z.toJSONSchema(MCP_CONFIG_SCHEMA, { target: "draft-2020-12", io: "input" }),
    $id: "https://static.stackra.figentra.com/schemas/mcp.json",
    title: "Stackra .mcp.yaml",
  };
}

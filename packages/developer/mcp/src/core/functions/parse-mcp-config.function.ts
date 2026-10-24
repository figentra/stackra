/**
 * Stackra file contract:
 * Purpose: `parseMcpConfig(document, source?)`, the one check of a `.mcp.yaml` document: its shape, then the rules of
 *          `ruleIssues`. Returns the parsed document, which is also the `.mcp.json` Claude Code reads.
 * Boundary: a parsed value in, a parsed value out; reading and YAML parsing are `readMcpConfig`'s (`./node`).
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 9 and 10, and enforcement); ADR 0173.
 */
import { MCP_CONFIG_SCHEMA } from "#core/constants/mcp-config-schema.constant";
import { McpConfigInvalidError } from "#core/errors/mcp-config-invalid.error";
import { ruleIssues } from "#core/functions/rule-issues.function";
import type { McpConfig } from "#core/types/mcp-config.type";

/**
 * The checked `.mcp.yaml`.
 *
 * @param document - the parsed YAML (or JSON) value.
 * @param source - the file path or a description, for the error; defaults to `.mcp.yaml`.
 * @throws McpConfigInvalidError naming every shape issue, or else every rule issue.
 * @example
 * const config = parseMcpConfig(parse(text), ".mcp.yaml");
 * config.mcpServers.stackra; // { command: "pnpm", args: ["exec", "stackra", "mcp"] }
 */
export function parseMcpConfig(document: unknown, source = ".mcp.yaml"): McpConfig {
  const result = MCP_CONFIG_SCHEMA.safeParse(document);
  if (!result.success)
    throw new McpConfigInvalidError(
      source,
      result.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        code: issue.code,
        message: issue.message,
      })),
    );
  const issues = ruleIssues(result.data);
  if (issues.length > 0) throw new McpConfigInvalidError(source, issues);
  return result.data;
}

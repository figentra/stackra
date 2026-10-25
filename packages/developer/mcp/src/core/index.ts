/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/mcp until `stackra gen` writes the entry barrels (STA-339): the
 *          `.mcp.yaml` check and its `.mcp.json` rendering, the command `stackra mcp exec` starts, and the hosted
 *          server core (the tool table from manifests, the per-tenant filter, the OAuth protected-resource metadata).
 * Boundary: names each re-export and declares nothing. Isomorphic: no Node import. The zod schema, the secret
 *           reference pattern and the rule check stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; ADR 0282 (decision 5); ADR 0155 (decision 4);
 *                     ADR 0348 (decision 2).
 */
export { McpConfigInvalidError } from "#core/errors/mcp-config-invalid.error";
export { filterTools } from "#core/functions/filter-tools.function";
export { mcpConfigJsonSchema } from "#core/functions/mcp-config-json-schema.function";
export { mcpExecCommand } from "#core/functions/mcp-exec-command.function";
export { parseMcpConfig } from "#core/functions/parse-mcp-config.function";
export { protectedResourceMetadata } from "#core/functions/protected-resource-metadata.function";
export { renderMcpJson } from "#core/functions/render-mcp-json.function";
export { secretNamesOf } from "#core/functions/secret-names-of.function";
export { shellCommandLine } from "#core/functions/shell-command-line.function";
export { toolTable } from "#core/functions/tool-table.function";
export { wwwAuthenticate } from "#core/functions/www-authenticate.function";
export type { CommandLine } from "#core/types/command-line.type";
export type { HostedTool } from "#core/types/hosted-tool.type";
export type { McpConfig } from "#core/types/mcp-config.type";
export type { McpExecOptions } from "#core/types/mcp-exec-options.type";
export type { McpIssue } from "#core/types/mcp-issue.type";
export type { McpServerDefinition } from "#core/types/mcp-server-definition.type";
export type { ProtectedResourceMetadata } from "#core/types/protected-resource-metadata.type";
export type { ProtectedResourceOptions } from "#core/types/protected-resource-options.type";
export type { ToolAccess } from "#core/types/tool-access.type";
export type { ToolFilterResult } from "#core/types/tool-filter-result.type";

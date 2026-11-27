/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/mcp until `stackra gen` writes the entry barrels
 *          (STA-339): what `@stackra/cli` wires to `stackra mcp` (the local server), `stackra mcp sync` and
 *          `stackra agents check` (the `.mcp.json` render and drift check) and `stackra mcp exec` (the launcher), the
 *          server's own tool commands (`DEV_TOOL_COMMANDS`, which the CLI's tests hold to the CLI's kinds and phases)
 *          and the shapes of their structured results.
 * Boundary: names each re-export and declares nothing. Node only: it reads files and starts processes. Imports `.`
 *           internals one way (ADR 0294 decision 15); exports none of `.`'s symbols. The stdio framing, the Encore
 *           client, the member reader, the output parsers and the default runner stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; ADR 0282 (decisions 3, 5 and 10); R-29.
 */
export { DEV_TOOL_COMMANDS } from "#node/constants/dev-tool-commands.constant";
export { McpProtocolError } from "#node/errors/mcp-protocol.error";
export { checkMcpConfig } from "#node/functions/check-mcp-config.function";
export { execWithSecrets } from "#node/functions/exec-with-secrets.function";
export { readMcpConfig } from "#node/functions/read-mcp-config.function";
export { serveLocalMcp } from "#node/functions/serve-local-mcp.function";
export { syncMcpConfig } from "#node/functions/sync-mcp-config.function";
export type { CommandOutcome } from "#node/types/command-outcome.type";
export type { Diagnostic } from "#node/types/diagnostic.type";
export type { LocalTool } from "#node/types/local-tool.type";
export type { McpPeer } from "#node/types/mcp-peer.type";
export type { ServeLocalMcpOptions } from "#node/types/serve-local-mcp-options.type";
export type { StackraRunner } from "#node/types/stackra-runner.type";
export type { TestSummary } from "#node/types/test-summary.type";
export type { ToolRunResult } from "#node/types/tool-run-result.type";

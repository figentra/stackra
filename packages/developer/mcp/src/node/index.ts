/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/mcp until `stackra gen` writes the entry barrels
 *          (STA-339): what `@stackra/cli` wires to `stackra mcp` (the local server), `stackra mcp sync` and
 *          `stackra agents check` (the `.mcp.json` render and drift check) and `stackra mcp exec` (the launcher).
 * Boundary: names each re-export and declares nothing. Node only: it reads files and starts processes. Imports `.`
 *           internals one way (ADR 0294 decision 15); exports none of `.`'s symbols. The stdio framing, the Encore
 *           client, the manifest reader and the default runner stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; ADR 0282 (decisions 3, 5 and 10); R-29.
 */
export { McpProtocolError } from "#node/errors/mcp-protocol.error";
export { checkMcpConfig } from "#node/functions/check-mcp-config.function";
export { execWithSecrets } from "#node/functions/exec-with-secrets.function";
export { readMcpConfig } from "#node/functions/read-mcp-config.function";
export { serveLocalMcp } from "#node/functions/serve-local-mcp.function";
export { syncMcpConfig } from "#node/functions/sync-mcp-config.function";
export type { CommandOutcome } from "#node/types/command-outcome.type";
export type { McpPeer } from "#node/types/mcp-peer.type";
export type { ServeLocalMcpOptions } from "#node/types/serve-local-mcp-options.type";
export type { StackraRunner } from "#node/types/stackra-runner.type";

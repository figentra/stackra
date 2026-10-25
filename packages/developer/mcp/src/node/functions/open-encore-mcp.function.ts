/**
 * Stackra file contract:
 * Purpose: `openEncoreMcp(root, version)`, the client end of the local Encore MCP (`encore mcp run --app=<id>`, the id
 *          from the root runway's `providers.encore.app`), initialized and ready for `tools/list` and `tools/call`,
 *          so `stackra mcp` can proxy calling endpoints, reading traces and querying the local databases.
 * Boundary: resolves `null`, with one line on standard error, when there is no root runway or Encore app, the
 *           Encore CLI is missing, or the handshake fails or takes longer than ten seconds; the local tools still work.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: call actions, read traces, query the local database); R-29 (`stackra mcp`
 *                     proxies the local Encore tools); ADR 0296 (the root runway).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { readRunway } from "@stackra/runway/node";

import { MCP_PROTOCOL_VERSIONS } from "#node/constants/mcp-protocol-versions.constant";
import { connectMcp } from "#node/functions/connect-mcp.function";
import type { McpPeer } from "#node/types/mcp-peer.type";

/** How long the Encore handshake may take. */
const HANDSHAKE_MS = 10_000;

/**
 * The initialized Encore MCP of the repository at `root`, or `null`.
 *
 * @param root - the repository root, holding `runway.yaml`.
 * @param version - the client version reported to Encore.
 * @example
 * const encore = await openEncoreMcp(process.cwd(), "1.0.0");
 * await encore?.request("tools/list");
 */
export async function openEncoreMcp(root: string, version: string): Promise<McpPeer | null> {
  const file = join(root, "runway.yaml");
  if (!existsSync(file)) return null;
  try {
    const encore = readRunway(file, "root").providers?.["encore"];
    const app =
      typeof encore === "object" && encore !== null ? (encore as { app?: unknown }).app : undefined;
    if (typeof app !== "string") return null;

    const child = spawn("encore", ["mcp", "run", `--app=${app}`], {
      cwd: root,
      stdio: ["pipe", "pipe", "inherit"],
    });
    const peer = connectMcp(child.stdout, child.stdin);
    child.on("error", () => peer.close());
    child.on("exit", () => peer.close());
    void peer.closed.then(() => child.kill());

    // Closing fails the waiting `initialize`, so a silent Encore cannot hold the server.
    const timer = setTimeout(() => peer.close(), HANDSHAKE_MS);
    try {
      await peer.request("initialize", {
        protocolVersion: MCP_PROTOCOL_VERSIONS[0],
        capabilities: {},
        clientInfo: { name: "stackra", version },
      });
    } finally {
      clearTimeout(timer);
    }
    peer.notify("notifications/initialized");
    return peer;
  } catch (error) {
    process.stderr.write(
      `stackra mcp: the local Encore tools are unavailable (${(error as Error).message})\n`,
    );
    return null;
  }
}

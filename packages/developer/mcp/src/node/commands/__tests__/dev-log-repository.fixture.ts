/**
 * Stackra file contract:
 * Purpose: the shared fixture of the dev log tool tests: a throwaway repository (a workspace root with the `web` app
 *          and the `orders` service), a dev log written through `appendDevLog`, and a local MCP server over it with a
 *          client that calls one tool.
 * Boundary: test support only; in-memory streams, a runner that is never called, the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2889.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";

import type { DevLogEntry } from "@stackra/runway";
import { appendDevLog, devLogFile } from "@stackra/runway/node";

import { connectMcp } from "#node/functions/connect-mcp.function";
import { serveLocalMcp } from "#node/functions/serve-local-mcp.function";

/** A tool call's result. */
type DevLogCalled = {
  readonly isError: boolean;
  readonly structuredContent: {
    readonly ok: boolean;
    readonly data?: Record<string, unknown>;
    readonly error?: { readonly message: string; readonly fix?: string };
  };
};

/** A repository root with the `web` app and the `orders` service. */
function devLogRepository(): string {
  const root = mkdtempSync(join(tmpdir(), "stackra-mcp-logs-"));
  const json = (path: string, value: unknown) => {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), JSON.stringify(value));
  };
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - services/*\n");
  json("package.json", { name: "acme" });
  json("apps/web/package.json", { name: "@acme/web" });
  json("apps/web/stackra.manifest.json", {
    member: "web",
    package: "@acme/web",
    version: "1",
    kind: "app",
  });
  json("services/orders/package.json", { name: "@acme/service-orders" });
  json("services/orders/stackra.manifest.json", {
    member: "orders",
    package: "@acme/service-orders",
    version: "1",
  });
  return root;
}

/** An entry `seconds` after 02:00:00 on 27 Nov 2026. */
function at(seconds: number, entry: Omit<DevLogEntry, "time">): DevLogEntry {
  return { time: new Date(Date.UTC(2026, 10, 27, 2, 0, seconds)).toISOString(), ...entry };
}

/** Writes `entries` to the repository's dev log. */
function writeDevLog(root: string, entries: readonly DevLogEntry[]): void {
  appendDevLog(devLogFile(root), entries);
}

/** Calls one tool of a local MCP server over `root`, then disconnects. */
async function callTool(root: string, name: string, args: unknown = {}): Promise<DevLogCalled> {
  const toServer = new PassThrough();
  const toClient = new PassThrough();
  const served = serveLocalMcp({
    version: "0.0.0",
    root,
    input: toServer,
    output: toClient,
    run: () => Promise.reject(new Error("no command runs in a dev log test")),
    encore: null,
    tools: [],
    env: {},
  });
  const client = connectMcp(toClient, toServer);
  try {
    return (await client.request("tools/call", { name, arguments: args })) as DevLogCalled;
  } finally {
    toServer.end();
    await served;
  }
}

/** The dev log tool tests' helpers: the repository, an entry at a time, the log writer and one tool call. */
export const devLogFixture = Object.freeze({ devLogRepository, at, writeDevLog, callTool });
